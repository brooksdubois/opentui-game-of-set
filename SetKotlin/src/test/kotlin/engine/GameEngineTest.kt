package engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
import org.brooks.domain.Card
import org.brooks.domain.Colors
import org.brooks.domain.Counts
import org.brooks.domain.DeckFactory
import org.brooks.domain.Fills
import org.brooks.engine.GameEngine
import org.brooks.engine.LeaderboardEntry
import org.brooks.engine.LeaderboardStore
import org.brooks.engine.GameStatus
import org.brooks.domain.Shapes
import org.brooks.rules.SetEvaluator

class GameEngineTest {
    @Test
    fun dealMoreDrawsFromRemainingDeck() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })
        val before = engine.currentState()

        val result = engine.dealMore()

        assertEquals(3, result.cardsDealt)
        assertEquals(before.board.size + 3, result.state.board.size)
        assertEquals(before.remainingCards - 3, result.state.remainingCards)
        assertBoardHasNoDuplicates(result.state.board)
    }

    @Test
    fun dealMoreStopsAtFifteenCards() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })

        engine.dealMore()

        val beforeNoOp = engine.currentState()
        val result = engine.dealMore()

        assertEquals(0, result.cardsDealt)
        assertEquals(15, result.state.board.size)
        assertEquals(beforeNoOp.board.size, result.state.board.size)
        assertBoardHasNoDuplicates(result.state.board)
    }

    @Test
    fun dealMoreCompletesGameWhenFifteenCardBoardStillHasNoSet() {
        val noSetBoard = noSetCards(15)
        val deck = noSetBoard + DeckFactory.standardSetDeck().filterNot { it in noSetBoard }
        val engine = GameEngine(deckFactory = { deck })

        assertFalse(engine.currentState().hasAnySetOnBoard)

        val expanded = engine.dealMore()
        assertEquals(3, expanded.cardsDealt)
        assertEquals(15, expanded.state.board.size)
        assertFalse(expanded.state.hasAnySetOnBoard)
        assertFalse(expanded.state.gameComplete)

        val completed = engine.dealMore()
        assertEquals(0, completed.cardsDealt)
        assertEquals(15, completed.state.board.size)
        assertFalse(completed.state.hasAnySetOnBoard)
        assertTrue(completed.state.gameComplete)
        assertEquals(GameStatus.Complete, completed.state.status)
    }

    @Test
    fun reDealCompletesGameWhenFifteenCardBoardStillHasNoSet() {
        val noSetBoard = noSetCards(15)
        val deck = noSetBoard + DeckFactory.standardSetDeck().filterNot { it in noSetBoard }
        val engine = GameEngine(deckFactory = { deck })

        engine.dealMore()
        val result = engine.reDeal()

        assertFalse(result.redealt)
        assertEquals(0, result.cardsAdded)
        assertEquals("no set found on 15-card board", result.message)
        assertEquals(15, result.state.board.size)
        assertFalse(result.state.hasAnySetOnBoard)
        assertTrue(result.state.gameComplete)
        assertEquals(GameStatus.Complete, result.state.status)
    }

    @Test
    fun reDealAddsOnlyUndealtCardsWhenBoardHasNoSet() {
        val noSetBoard = noSetCards(12)
        val deck = noSetBoard + DeckFactory.standardSetDeck().filterNot { it in noSetBoard }
        val engine = GameEngine(deckFactory = { deck })

        assertFalse(engine.currentState().hasAnySetOnBoard)

        val result = engine.reDeal()

        assertTrue(result.redealt)
        assertTrue(result.cardsAdded > 0)
        assertTrue(result.state.hasAnySetOnBoard || result.state.gameComplete)
        assertTrue(result.state.remainingCards < 69)
        assertBoardHasNoDuplicates(result.state.board)
    }

    @Test
    fun reDealIsNoOpWhenBoardAlreadyHasSet() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })
        if (!engine.currentState().hasAnySetOnBoard) {
            engine.dealMore()
        }

        assertTrue(engine.currentState().hasAnySetOnBoard)
        val before = engine.currentState()

        val result = engine.reDeal()

        assertFalse(result.redealt)
        assertEquals(0, result.cardsAdded)
        assertEquals(before.board, result.state.board)
        assertEquals(before.remainingCards, result.state.remainingCards)
    }

    @Test
    fun repeatedValidPlayDoesNotCreateVisibleDuplicates() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })

        repeat(10) {
            val hint = engine.findHint() ?: run {
                engine.reDeal()
                engine.findHint()
            }

            assertNotNull(hint)
            hint.forEach { engine.toggleSelection(it.boardIndex) }

            val submission = engine.submitSelectedSet()

            assertTrue(submission.isSet)
            assertBoardHasNoDuplicates(submission.state.board)
        }
    }

    @Test
    fun gameCompletesWhenDeckIsEmptyAndNoSetExistsInLiveCards() {
        val engine = GameEngine(deckFactory = { noSetCards(12) })
        val state = engine.currentState()

        assertEquals(0, state.remainingCards)
        assertFalse(state.hasAnySetOnBoard)
        assertTrue(state.gameComplete)
        assertEquals(GameStatus.Complete, state.status)
    }

    @Test
    fun validSetAwardsBaseAndAttributeBonuses() {
        val scoringCards = scoringCards()
        val fillerCards = noSetCards(12).filterNot { it in scoringCards }.take(9)
        val deck = scoringCards + fillerCards
        val engine = GameEngine(deckFactory = { deck })

        engine.toggleSelection(0)
        engine.toggleSelection(1)
        engine.toggleSelection(2)
        val submission = engine.submitSelectedSet()

        assertTrue(submission.isSet)
        assertEquals(106, submission.state.score)
        assertEquals(
            listOf("Set", "Color bonus", "Shading bonus", "Shape bonus", "Win bonus"),
            submission.scoreEvents.map { it.label },
        )
    }

    @Test
    fun invalidSetAppliesPenalty() {
        val engine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })

        engine.toggleSelection(0)
        engine.toggleSelection(1)
        engine.toggleSelection(3)
        val submission = engine.submitSelectedSet()

        assertFalse(submission.isSet)
        assertEquals(-2, submission.state.score)
        assertEquals(listOf("Invalid set"), submission.scoreEvents.map { it.label })
    }

    @Test
    fun quickSetBonusAppliesOnlyInsideDealMoreWindow() {
        val clock = mutableListOf(1_000L)
        val scoringCards = scoringCards()
        val fillerCards = noSetCards(12).filterNot { it in scoringCards }.take(9)
        val deck = scoringCards + fillerCards + DeckFactory.standardSetDeck().filterNot { it in (scoringCards + fillerCards) }
        val engine = GameEngine(deckFactory = { deck }, nowMs = { clock.last() })

        val dealMore = engine.dealMore()
        assertEquals(3, dealMore.cardsDealt)

        clock += 9_000L
        engine.toggleSelection(0)
        engine.toggleSelection(1)
        engine.toggleSelection(2)
        val quick = engine.submitSelectedSet()
        assertEquals(16, quick.state.score)
        assertEquals("Quick set", quick.scoreEvents.last().label)

        val secondClock = mutableListOf(1_000L)
        val secondEngine = GameEngine(deckFactory = { deck }, nowMs = { secondClock.last() })
        secondEngine.dealMore()
        secondClock += 12_000L
        secondEngine.toggleSelection(0)
        secondEngine.toggleSelection(1)
        secondEngine.toggleSelection(2)
        val expired = secondEngine.submitSelectedSet()
        assertEquals(6, expired.state.score)
        assertFalse(expired.scoreEvents.any { it.label == "Quick set" })
    }

    @Test
    fun redealScoreMatchesBoardState() {
        val withSetEngine = GameEngine(deckFactory = { DeckFactory.standardSetDeck() })
        val withSetResult = withSetEngine.reDeal()
        assertEquals(-3, withSetResult.state.score)
        assertEquals(listOf("Redeal penalty"), withSetResult.scoreEvents.map { it.label })

        val noSetBoard = noSetCards(12)
        val noSetDeck = noSetBoard + DeckFactory.standardSetDeck().filterNot { it in noSetBoard }
        val noSetEngine = GameEngine(deckFactory = { noSetDeck })
        val noSetResult = noSetEngine.reDeal()
        assertTrue(noSetResult.state.score >= 5)
        assertEquals(listOf("Redeal rescue"), noSetResult.scoreEvents.map { it.label })
    }

    @Test
    fun completedQualifyingGameMarksLeaderboardEntryPending() {
        val store = InMemoryLeaderboardStore(
            MutableList(9) { index ->
                LeaderboardEntry(
                    initials = "P$index",
                    score = 99 - index,
                    achievedAt = "2026-03-${index + 1}T00:00:00.000Z",
                )
            },
        )
        val scoringCards = scoringCards()
        val fillerCards = noSetCards(12).filterNot { it in scoringCards }.take(9)
        val deck = scoringCards + fillerCards
        val engine = GameEngine(deckFactory = { deck }, leaderboardStore = store)

        engine.toggleSelection(0)
        engine.toggleSelection(1)
        engine.toggleSelection(2)
        val submission = engine.submitSelectedSet()

        assertTrue(submission.state.gameComplete)
        assertTrue(submission.state.leaderboardPendingEntry)
        assertEquals(106, submission.state.score)
    }

    @Test
    fun submitHighScorePersistsAndClearsPendingFlag() {
        val store = InMemoryLeaderboardStore(
            MutableList(9) { index ->
                LeaderboardEntry(
                    initials = "P$index",
                    score = 99 - index,
                    achievedAt = "2026-03-${index + 1}T00:00:00.000Z",
                )
            },
        )
        val scoringCards = scoringCards()
        val fillerCards = noSetCards(12).filterNot { it in scoringCards }.take(9)
        val deck = scoringCards + fillerCards
        val clock = mutableListOf(1_000L)
        val engine = GameEngine(deckFactory = { deck }, leaderboardStore = store, nowMs = { clock.last() })

        engine.toggleSelection(0)
        engine.toggleSelection(1)
        engine.toggleSelection(2)
        engine.submitSelectedSet()
        clock += 2_000L
        val saveResult = engine.submitHighScore("abc")

        assertEquals("ABC", saveResult.savedEntry.initials)
        assertFalse(saveResult.state.leaderboardPendingEntry)
        assertEquals("ABC", store.savedEntries.first().initials)
        assertEquals(10, store.savedEntries.size)
    }

    private fun noSetCards(count: Int): List<Card> {
        val cards = mutableListOf<Card>()

        DeckFactory.standardSetDeck().forEach { card ->
            val candidate = cards + card
            if (!SetEvaluator.hasAnySet(candidate)) {
                cards.add(card)
            }
            if (cards.size == count) return cards
        }

        error("Could not build $count cards without a set")
    }

    private fun assertBoardHasNoDuplicates(cards: List<Card>) {
        assertEquals(cards.size, cards.toSet().size)
    }

    private fun scoringCards(): List<Card> =
        listOf(
            Card(shape = Shapes.Oval, color = Colors.Red, fill = Fills.Shaded, count = Counts.`1`),
            Card(shape = Shapes.Squiggle, color = Colors.Green, fill = Fills.Light, count = Counts.`1`),
            Card(shape = Shapes.Diamond, color = Colors.Blue, fill = Fills.Full, count = Counts.`1`),
        )

    private class InMemoryLeaderboardStore(
        private val initialEntries: List<LeaderboardEntry> = emptyList(),
    ) : LeaderboardStore {
        var savedEntries: List<LeaderboardEntry> = initialEntries
            private set

        override fun load(): List<LeaderboardEntry> = savedEntries

        override fun save(entries: List<LeaderboardEntry>) {
            savedEntries = entries
        }
    }
}
