package org.brooks.engine

import org.brooks.domain.Card

enum class GameStatus {
    Running,
    Complete,
}

data class SelectedCard(
    val position: BoardPosition,
    val boardIndex: Int,
    val card: Card,
)

data class GameState(
    val board: List<Card>,
    val selectedCards: List<SelectedCard>,
    val remainingCards: Int,
    val foundSets: Int,
    val status: GameStatus,
    val hasAnySetOnBoard: Boolean,
    val gameComplete: Boolean,
)

data class SetSubmission(
    val isSet: Boolean,
    val selectedCards: List<SelectedCard>,
    val state: GameState,
)

data class DealMoreResult(
    val cardsDealt: Int,
    val state: GameState,
)

data class ReDealResult(
    val redealt: Boolean,
    val cardsAdded: Int,
    val state: GameState,
    val message: String,
)
