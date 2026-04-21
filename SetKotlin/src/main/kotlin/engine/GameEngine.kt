package org.brooks.engine

import org.brooks.domain.Card
import org.brooks.domain.DeckFactory
import org.brooks.rules.SetEvaluator

class GameEngine(
    private val layout: BoardLayout = BoardLayout(),
    private val evaluator: SetEvaluator = SetEvaluator,
    private val deckFactory: () -> List<Card> = { DeckFactory.standardSetDeck().shuffled() },
) {
    private val deck = mutableListOf<Card>()
    private val board = mutableListOf<Card>()
    private val selectedIndexes = mutableListOf<Int>()
    private var foundSets = 0
    private var status = GameStatus.Running

    init {
        reset()
    }

    fun currentState(): GameState =
        GameState(
            board = board.toList(),
            selectedCards = selectedCards(),
            remainingCards = deck.size,
            foundSets = foundSets,
            status = status,
        )

    fun reset(): GameState {
        val shuffledDeck = deckFactory()
        require(shuffledDeck.size >= layout.boardSize) {
            "Deck must contain at least ${layout.boardSize} cards"
        }

        board.clear()
        deck.clear()
        selectedIndexes.clear()
        foundSets = 0
        status = GameStatus.Running

        board.addAll(shuffledDeck.take(layout.boardSize))
        deck.addAll(shuffledDeck.drop(layout.boardSize))

        return currentState()
    }

    fun select(position: BoardPosition): GameState = select(layout.indexOf(position))

    fun select(boardIndex: Int): GameState {
        require(boardIndex in board.indices) { "Invalid board index: $boardIndex" }
        selectedIndexes.add(boardIndex)
        return currentState()
    }

    fun unselect(position: BoardPosition): GameState = unselect(layout.indexOf(position))

    fun unselect(boardIndex: Int): GameState {
        selectedIndexes.remove(boardIndex)
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

        val submittedCards = selectedCards()
        val isSet = evaluator.areCardsASet(submittedCards.map { it.card })

        if (isSet) {
            foundSets += 1
            replaceSelectedCards()
        }

        selectedIndexes.clear()

        return SetSubmission(
            isSet = isSet,
            selectedCards = submittedCards,
            state = currentState(),
        )
    }

    private fun selectedCards(): List<SelectedCard> =
        selectedIndexes.map { boardIndex ->
            require(boardIndex in board.indices) { "Invalid board index: $boardIndex" }
            SelectedCard(
                position = layout.positionOf(boardIndex),
                boardIndex = boardIndex,
                card = board[boardIndex],
            )
        }

    private fun replaceSelectedCards() {
        if (deck.size < selectedIndexes.size) {
            status = GameStatus.GameOver
            return
        }

        selectedIndexes.forEach { boardIndex ->
            board[boardIndex] = deck.removeAt(0)
        }
    }
}
