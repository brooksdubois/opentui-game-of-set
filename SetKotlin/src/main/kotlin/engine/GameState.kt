package org.brooks.engine

import org.brooks.domain.Card

enum class GameStatus {
    Running,
    GameOver,
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
)

data class SetSubmission(
    val isSet: Boolean,
    val selectedCards: List<SelectedCard>,
    val state: GameState,
)
