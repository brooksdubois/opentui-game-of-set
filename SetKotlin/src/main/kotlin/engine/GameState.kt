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
    val score: Int,
    val leaderboard: List<LeaderboardEntry>,
    val leaderboardPendingEntry: Boolean,
    val status: GameStatus,
    val hasAnySetOnBoard: Boolean,
    val gameComplete: Boolean,
)

data class ScoreEvent(
    val label: String,
    val points: Int,
)

data class SetSubmission(
    val isSet: Boolean,
    val selectedCards: List<SelectedCard>,
    val state: GameState,
    val scoreEvents: List<ScoreEvent>,
)

data class DealMoreResult(
    val cardsDealt: Int,
    val state: GameState,
    val scoreEvents: List<ScoreEvent>,
)

data class ReDealResult(
    val redealt: Boolean,
    val cardsAdded: Int,
    val state: GameState,
    val message: String,
    val scoreEvents: List<ScoreEvent>,
)

data class HighScoreSubmissionResult(
    val state: GameState,
    val savedEntry: LeaderboardEntry,
)
