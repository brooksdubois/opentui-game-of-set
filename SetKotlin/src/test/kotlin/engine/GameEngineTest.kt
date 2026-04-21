package engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue
import org.brooks.domain.Card
import org.brooks.domain.DeckFactory
import org.brooks.engine.GameEngine
import org.brooks.engine.GameStatus
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
}
