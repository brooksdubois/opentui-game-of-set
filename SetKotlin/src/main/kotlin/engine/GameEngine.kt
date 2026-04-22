package org.brooks.engine

import org.brooks.domain.Card
import org.brooks.domain.DeckFactory
import org.brooks.rules.SetEvaluator

class GameEngine(
    private val layout: BoardLayout = BoardLayout(),
    private val evaluator: SetEvaluator = SetEvaluator,
    private val deckFactory: () -> List<Card> = { DeckFactory.standardSetDeck().shuffled() },
) {
    private val maxBoardSize = 15
    private val deck = mutableListOf<Card>()
    private val board = mutableListOf<Card>()
    private val selectedIndexes = mutableListOf<Int>()
    private var foundSets = 0
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
        require(selectedIndexes.size == 3) { "Exactly 3 cards must be selected" }
        require(selectedIndexes.distinct().size == 3) { "Selected cards must be distinct" }

        val submittedCards = selectedCards()
        val isSet = evaluator.areCardsASet(submittedCards.map { it.card })

        if (isSet) {
            foundSets += 1
            replaceOrRemoveMatchedSet(selectedIndexes)
        }

        selectedIndexes.clear()

        return SetSubmission(
            isSet = isSet,
            selectedCards = submittedCards,
            state = currentState(),
        )
    }

    fun dealMore(count: Int = 3): DealMoreResult {
        require(count > 0) { "Deal count must be positive" }
        selectedIndexes.clear()

        if (board.size >= maxBoardSize) {
            if (!hasAnySetOnBoard()) {
                forcedComplete = true
            }

            return DealMoreResult(
                cardsDealt = 0,
                state = currentState(),
            )
        }

        val cardsToDeal = minOf(count, deck.size, maxBoardSize - board.size)
        repeat(cardsToDeal) {
            board.add(deck.removeAt(0))
        }

        return DealMoreResult(
            cardsDealt = cardsToDeal,
            state = currentState(),
        )
    }

    fun reDeal(): ReDealResult {
        selectedIndexes.clear()

        if (hasAnySetOnBoard()) {
            return ReDealResult(
                redealt = false,
                cardsAdded = 0,
                state = currentState(),
                message = "board already contains a set",
            )
        }

        if (board.size >= maxBoardSize) {
            forcedComplete = true
            return ReDealResult(
                redealt = false,
                cardsAdded = 0,
                state = currentState(),
                message = "no set found on 15-card board",
            )
        }

        if (deck.isEmpty()) {
            return ReDealResult(
                redealt = false,
                cardsAdded = 0,
                state = currentState(),
                message = "no undealt cards remain",
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

        return ReDealResult(
            redealt = true,
            cardsAdded = cardsAdded,
            state = currentState(),
            message = if (hasAnySetOnBoard()) {
                "re-dealt board with a valid set"
            } else {
                "re-dealt board but no valid sets remain"
            },
        )
    }

    fun hasAnySetOnBoard(): Boolean =
        evaluator.hasAnySet(board)

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
        if (forcedComplete || board.isEmpty() || !evaluator.hasAnySet(board + deck)) {
            GameStatus.Complete
        } else {
            GameStatus.Running
        }
}
