package org.brooks.engine

import org.brooks.domain.Card
import org.brooks.domain.DeckFactory
import org.brooks.rules.SetEvaluator

class GameEngine(
    private val layout: BoardLayout = BoardLayout(),
    private val evaluator: SetEvaluator = SetEvaluator,
    private val deckFactory: () -> List<Card> = { DeckFactory.standardSetDeck().shuffled() },
    private val leaderboardStore: LeaderboardStore = FileLeaderboardStore(),
    private val nowMs: () -> Long = System::currentTimeMillis,
) {
    private val quickSetWindowMs = 10_000L
    private val maxBoardSize = 15
    private val deck = mutableListOf<Card>()
    private val board = mutableListOf<Card>()
    private val selectedIndexes = mutableListOf<Int>()
    private val leaderboard = leaderboardStore.load().toMutableList()
    private var foundSets = 0
    private var score = 0
    private var quickSetStartedAtMs: Long? = null
    private var highScoreSavedForCurrentGame = false
    private var winBonusAwarded = false
    private var forcedComplete = false

    init {
        reset()
    }

    fun currentState(): GameState {
        val hasAnySetOnBoard = hasAnySetOnBoard()
        val status = currentStatus()

        return GameState(
            board = board.toList(),
            selectedCards = selectedCards(),
            remainingCards = deck.size,
            foundSets = foundSets,
            score = score,
            leaderboard = leaderboard.toList(),
            leaderboardPendingEntry = isLeaderboardPending(),
            status = status,
            hasAnySetOnBoard = hasAnySetOnBoard,
            gameComplete = status == GameStatus.Complete,
        )
    }

    fun reset(): GameState {
        val shuffledDeck = deckFactory()
        require(shuffledDeck.size >= layout.boardSize) {
            "Deck must contain at least ${layout.boardSize} cards"
        }

        board.clear()
        deck.clear()
        selectedIndexes.clear()
        foundSets = 0
        score = 0
        quickSetStartedAtMs = null
        highScoreSavedForCurrentGame = false
        winBonusAwarded = false
        forcedComplete = false

        board.addAll(shuffledDeck.take(layout.boardSize))
        deck.addAll(shuffledDeck.drop(layout.boardSize))

        return currentState()
    }

    fun select(position: BoardPosition): GameState = select(layout.indexOf(position))

    fun select(boardIndex: Int): GameState {
        require(boardIndex in board.indices) { "Invalid board index: $boardIndex" }
        require(boardIndex !in selectedIndexes) { "Card is already selected: $boardIndex" }
        require(selectedIndexes.size < 3) { "Cannot select more than 3 cards" }
        selectedIndexes.add(boardIndex)
        return currentState()
    }

    fun unselect(position: BoardPosition): GameState = unselect(layout.indexOf(position))

    fun unselect(boardIndex: Int): GameState {
        selectedIndexes.remove(boardIndex)
        return currentState()
    }

    fun toggleSelection(boardIndex: Int): GameState {
        require(boardIndex in board.indices) { "Invalid board index: $boardIndex" }

        if (!selectedIndexes.remove(boardIndex)) {
            require(selectedIndexes.size < 3) { "Cannot select more than 3 cards" }
            selectedIndexes.add(boardIndex)
        }

        return currentState()
    }

    fun clearSelection(): GameState {
        selectedIndexes.clear()
        return currentState()
    }

    fun selectCardsAt(positions: List<BoardPosition>): GameState {
        selectedIndexes.clear()
        positions.forEach { select(it) }
        return currentState()
    }

    fun submitSelectedSet(): SetSubmission {
        val wasComplete = isGameComplete()
        require(selectedIndexes.size == 3) { "Exactly 3 cards must be selected" }
        require(selectedIndexes.distinct().size == 3) { "Selected cards must be distinct" }

        val submittedCards = selectedCards()
        val isSet = evaluator.areCardsASet(submittedCards.map { it.card })
        val scoreEvents = mutableListOf<ScoreEvent>()

        if (isSet) {
            scoreEvents += ScoreEvent("Set", 3)
            score += 3
            applyAttributeBonuses(submittedCards.map { it.card }, scoreEvents)
            applyQuickSetBonus(scoreEvents)
            foundSets += 1
            replaceOrRemoveMatchedSet(selectedIndexes)
        } else {
            score -= 2
            scoreEvents += ScoreEvent("Invalid set", -2)
        }

        selectedIndexes.clear()
        maybeAwardWinBonus(wasComplete, scoreEvents)

        return SetSubmission(
            isSet = isSet,
            selectedCards = submittedCards,
            state = currentState(),
            scoreEvents = scoreEvents.toList(),
        )
    }

    fun dealMore(count: Int = 3): DealMoreResult {
        val wasComplete = isGameComplete()
        require(count > 0) { "Deal count must be positive" }
        selectedIndexes.clear()
        val previousBoardSize = board.size
        val scoreEvents = mutableListOf<ScoreEvent>()

        if (board.size >= maxBoardSize) {
            if (!hasAnySetOnBoard()) {
                forcedComplete = true
            }
            maybeAwardWinBonus(wasComplete, scoreEvents)

            return DealMoreResult(
                cardsDealt = 0,
                state = currentState(),
                scoreEvents = scoreEvents.toList(),
            )
        }

        val cardsToDeal = minOf(count, deck.size, maxBoardSize - board.size)
        repeat(cardsToDeal) {
            board.add(deck.removeAt(0))
        }
        if (previousBoardSize == layout.boardSize && cardsToDeal > 0) {
            quickSetStartedAtMs = nowMs()
        }
        maybeAwardWinBonus(wasComplete, scoreEvents)

        return DealMoreResult(
            cardsDealt = cardsToDeal,
            state = currentState(),
            scoreEvents = scoreEvents.toList(),
        )
    }

    fun reDeal(): ReDealResult {
        val wasComplete = isGameComplete()
        selectedIndexes.clear()
        val scoreEvents = mutableListOf<ScoreEvent>()

        if (hasAnySetOnBoard()) {
            score -= 3
            scoreEvents += ScoreEvent("Redeal penalty", -3)
            maybeAwardWinBonus(wasComplete, scoreEvents)
            return ReDealResult(
                redealt = false,
                cardsAdded = 0,
                state = currentState(),
                message = "board already contains a set",
                scoreEvents = scoreEvents.toList(),
            )
        }

        if (board.size >= maxBoardSize) {
            forcedComplete = true
            score += 5
            scoreEvents += ScoreEvent("Redeal rescue", 5)
            maybeAwardWinBonus(wasComplete, scoreEvents)
            return ReDealResult(
                redealt = false,
                cardsAdded = 0,
                state = currentState(),
                message = "no set found on 15-card board",
                scoreEvents = scoreEvents.toList(),
            )
        }

        if (deck.isEmpty()) {
            score += 5
            scoreEvents += ScoreEvent("Redeal rescue", 5)
            maybeAwardWinBonus(wasComplete, scoreEvents)
            return ReDealResult(
                redealt = false,
                cardsAdded = 0,
                state = currentState(),
                message = "no undealt cards remain",
                scoreEvents = scoreEvents.toList(),
            )
        }

        var cardsAdded = 0
        while (!hasAnySetOnBoard() && deck.isNotEmpty()) {
            val cardsToDeal = minOf(3, deck.size)
            repeat(cardsToDeal) {
                board.add(deck.removeAt(0))
                cardsAdded += 1
            }
        }

        board.shuffle()
        score += 5
        scoreEvents += ScoreEvent("Redeal rescue", 5)
        maybeAwardWinBonus(wasComplete, scoreEvents)

        return ReDealResult(
            redealt = true,
            cardsAdded = cardsAdded,
            state = currentState(),
            message = if (hasAnySetOnBoard()) {
                "re-dealt board with a valid set"
            } else {
                "re-dealt board but no valid sets remain"
            },
            scoreEvents = scoreEvents.toList(),
        )
    }

    fun hasAnySetOnBoard(): Boolean =
        evaluator.hasAnySet(board)

    fun submitHighScore(initials: String): HighScoreSubmissionResult {
        require(isLeaderboardPending()) { "No pending high score to save" }
        require(initials.matches(Regex("^[A-Za-z]{3}$"))) { "High score initials must be exactly 3 letters" }

        val entry = LeaderboardEntry(
            initials = initials.uppercase(),
            score = score,
            achievedAt = java.time.Instant.ofEpochMilli(nowMs()).toString(),
        )
        val nextLeaderboard = insertLeaderboardEntry(leaderboard.toList(), entry)
        leaderboard.clear()
        leaderboard.addAll(nextLeaderboard)
        leaderboardStore.save(leaderboard)
        highScoreSavedForCurrentGame = true

        return HighScoreSubmissionResult(
            state = currentState(),
            savedEntry = entry,
        )
    }

    fun findHint(): List<SelectedCard>? {
        return evaluator.findFirstSetIndexes(board)?.map(::selectedCardAt)
    }

    private fun selectedCards(): List<SelectedCard> =
        selectedIndexes.map(::selectedCardAt)

    private fun selectedCardAt(boardIndex: Int): SelectedCard {
        require(boardIndex in board.indices) { "Invalid board index: $boardIndex" }
        return SelectedCard(
            position = layout.positionOf(boardIndex),
            boardIndex = boardIndex,
            card = board[boardIndex],
        )
    }

    private fun replaceOrRemoveMatchedSet(matchedIndexes: List<Int>) {
        val indexes = matchedIndexes.distinct().sorted()

        if (board.size > layout.boardSize) {
            indexes.asReversed().forEach { board.removeAt(it) }
            return
        }

        val indexesToRemove = mutableListOf<Int>()
        indexes.forEach { boardIndex ->
            if (deck.isNotEmpty()) {
                board[boardIndex] = deck.removeAt(0)
            } else {
                indexesToRemove.add(boardIndex)
            }
        }

        indexesToRemove.asReversed().forEach { board.removeAt(it) }
    }

    private fun currentStatus(): GameStatus =
        if (isGameComplete()) {
            GameStatus.Complete
        } else {
            GameStatus.Running
        }

    private fun isLeaderboardPending(): Boolean =
        isGameComplete() && !highScoreSavedForCurrentGame && qualifiesForLeaderboard(score)

    private fun isGameComplete(): Boolean =
        forcedComplete || board.isEmpty() || !evaluator.hasAnySet(board + deck)

    private fun applyAttributeBonuses(cards: List<Card>, scoreEvents: MutableList<ScoreEvent>) {
        if (hasAllDifferent(cards.map { it.color })) {
            score += 1
            scoreEvents += ScoreEvent("Color bonus", 1)
        }
        if (hasAllDifferent(cards.map { it.fill })) {
            score += 1
            scoreEvents += ScoreEvent("Shading bonus", 1)
        }
        if (hasAllDifferent(cards.map { it.shape })) {
            score += 1
            scoreEvents += ScoreEvent("Shape bonus", 1)
        }
    }

    private fun applyQuickSetBonus(scoreEvents: MutableList<ScoreEvent>) {
        val startedAt = quickSetStartedAtMs ?: return
        if (nowMs() - startedAt <= quickSetWindowMs) {
            score += 10
            scoreEvents += ScoreEvent("Quick set", 10)
            quickSetStartedAtMs = null
        }
    }

    private fun maybeAwardWinBonus(wasComplete: Boolean, scoreEvents: MutableList<ScoreEvent>) {
        if (!wasComplete && isGameComplete() && !winBonusAwarded) {
            score += 100
            winBonusAwarded = true
            quickSetStartedAtMs = null
            scoreEvents += ScoreEvent("Win bonus", 100)
        }
    }

    private fun hasAllDifferent(values: List<String>): Boolean =
        values.toSet().size == values.size

    private fun qualifiesForLeaderboard(score: Int): Boolean {
        if (leaderboard.size < 10) return true
        return score > (leaderboard.lastOrNull()?.score ?: Int.MIN_VALUE)
    }

    private fun insertLeaderboardEntry(
        entries: List<LeaderboardEntry>,
        entry: LeaderboardEntry,
    ): List<LeaderboardEntry> =
        (entries + entry)
            .sortedWith(compareByDescending<LeaderboardEntry> { it.score }.thenBy { it.achievedAt })
            .take(10)
}
