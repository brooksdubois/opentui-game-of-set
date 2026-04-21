package org.brooks.rendering

import org.brooks.domain.Card
import org.brooks.domain.Color
import org.brooks.domain.Colors
import org.brooks.domain.Counts
import org.brooks.domain.Fill
import org.brooks.domain.Fills
import org.brooks.domain.Shape
import org.brooks.domain.Shapes
import org.brooks.rendering.ConsoleColor.BLUE
import org.brooks.rendering.ConsoleColor.GREEN
import org.brooks.rendering.ConsoleColor.RED
import org.brooks.rendering.ConsoleColor.WHITE
import org.brooks.rendering.FillCodes.EMPTY
import org.brooks.rendering.FillCodes.FULL
import org.brooks.rendering.FillCodes.MED

typealias AsciiShape = String
typealias AsciiCard = String
typealias FillCode = String

object FillCodes {
    const val EMPTY: FillCode = " "
    const val MED: FillCode = "."
    const val FULL: FillCode = "="
}

object CardRenderer {
    private const val bgColor: ColorCode = WHITE

    fun renderCard(card: Card): AsciiCard =
        when (card.count) {
            Counts.`1` -> drawCard1(card.shape, card.color, card.fill)
            Counts.`2` -> drawCard2(card.shape, card.color, card.fill)
            Counts.`3` -> drawCard3(card.shape, card.color, card.fill)
            else -> throw Error("No matching shape count")
        }

    fun renderPlayableCards(cards: List<Card>): String = buildString {
        cards.chunked(4).forEach { row ->
            append(renderRow(row))
            appendLine()
        }
    }

    private fun renderRow(cards: List<Card>): String =
        combineVertically(
            noLog = true,
            *cards.map(::renderCard)
                .flatMapIndexed { index, card ->
                    if (index == cards.lastIndex) listOf(card) else listOf(card, emptyLongSpace())
                }
                .toTypedArray(),
        )

    private fun drawCard1(shape: Shape, color: Color, fill: Fill): String {
        val colorCode = getColorCode(color)
        val fillCode = getFillCode(fill)
        val combineVertical = combineVertically(
            noLog = true,
            leftCard,
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            getShape(shape, colorCode, fillCode),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            rightCard,
        )
        return """
${getTopCard()}
$combineVertical
${getBottomCard()}
"""
    }

    private fun drawCard2(shape: Shape, color: Color, fill: Fill): String {
        val colorCode = getColorCode(color)
        val fillCode = getFillCode(fill)
        val combineVertical = combineVertically(
            noLog = true,
            leftCard,
            emptySpace(),
            emptySpace(),
            emptySpace(),
            getShape(shape, colorCode, fillCode),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            getShape(shape, colorCode, fillCode),
            emptySpace(),
            emptySpace(),
            emptySpace(),
            rightCard,
        )
        return """
${getTopCard()}
$combineVertical
${getBottomCard()}
"""
    }

    private fun drawCard3(shape: Shape, color: Color, fill: Fill): String {
        val colorCode = getColorCode(color)
        val fillCode = getFillCode(fill)
        val combineVertical = combineVertically(
            noLog = true,
            leftCard,
            getShape(shape, colorCode, fillCode),
            getShape(shape, colorCode, fillCode),
            getShape(shape, colorCode, fillCode),
            rightCard,
        )
        return """
${getTopCard()}
$combineVertical
${getBottomCard()}
"""
    }

    private fun getShape(shape: Shape, colorCode: ColorCode, fillCode: FillCode): AsciiShape =
        when (shape) {
            Shapes.Squiggle -> getSquiggle(colorCode, fillCode)
            Shapes.Diamond -> getDiamond(colorCode, fillCode)
            Shapes.Oval -> getOval(colorCode, fillCode)
            else -> throw Error("No matching shape code")
        }

    private fun getColorCode(color: Color): ColorCode =
        when (color) {
            Colors.Red -> RED
            Colors.Blue -> BLUE
            Colors.Green -> GREEN
            else -> throw Error("No matching color code")
        }

    private fun getFillCode(fill: Fill): FillCode =
        when (fill) {
            Fills.Full -> FULL
            Fills.Light -> EMPTY
            Fills.Shaded -> MED
            else -> throw Error("No matching color code")
        }

    private fun getTopCard(c: ColorCode = bgColor): String = """$c _________________________________ 
$c*                                 *"""

    private fun getBottomCard(c: ColorCode = bgColor): String = "$c*_________________________________*"

    private fun getEdgeCard(c: ColorCode = bgColor): String = """
$c!
$c!
$c!
$c!
$c!
$c!
$c!
"""

    private fun emptySpace(): String = "\n`\n`\n`\n`\n`\n`\n`\n"

    private fun emptyLongSpace(): String = "\n  \n  \n  \n  \n  \n  \n  \n  \n  \n  \n  "

    private val leftCard = combineVertically(noLog = true, getEdgeCard(), emptySpace(), emptySpace(), emptySpace())

    private val rightCard = combineVertically(noLog = true, emptySpace(), emptySpace(), emptySpace(), getEdgeCard())

    private fun getSquiggle(c: ColorCode, f: FillCode, e: ColorCode = bgColor): AsciiShape = """
$c  .''.   $e
$c  \$f$f$f\  $e
$c  /$f$f$f/  $e
$c /$f$f$f\   $e
$c  \$f$f$f\  $e
$c  /$f$f$f/  $e
$c  '..'   $e
"""

    private fun getDiamond(c: ColorCode, f: FillCode, e: ColorCode = bgColor): AsciiShape = """
$c    A    $e
$c   /$f\   $e
$c  /$f$f$f\  $e
$c <$f$f$f$f$f> $e
$c  \$f$f$f/  $e
$c   \$f/   $e
$c    V    $e
"""

    private fun getOval(c: ColorCode, f: FillCode, e: ColorCode = bgColor): AsciiShape = """
$c .-'''-. $e
$c |$f$f$f$f$f| $e
$c |$f$f$f$f$f| $e
$c |$f$f$f$f$f| $e
$c |$f$f$f$f$f| $e
$c |$f$f$f$f$f| $e
$c '-___-' $e
"""
}

fun combineVertically(noLog: Boolean? = false, vararg strings: String): String {
    val linesList = strings.map { it.trimIndent().lines() }
    val expectedSize = linesList.firstOrNull()?.size ?: return ""
    val hasBadNumLines = linesList.any { it.size != expectedSize }

    if (hasBadNumLines) {
        if (noLog != true) {
            linesList.forEach { println("${it.size} $expectedSize") }
        }
        throw IllegalArgumentException("Line Length Error")
    }

    return (0 until expectedSize).joinToString("\n") { i ->
        linesList.joinToString(separator = "") { it[i] }
    }
}
