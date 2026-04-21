package org.brooks

import org.brooks.ConsoleColor.BLUE
import org.brooks.ConsoleColor.GREEN
import org.brooks.ConsoleColor.RED
import org.brooks.ConsoleColor.WHITE
import org.brooks.FillCodes.EMPTY
import org.brooks.FillCodes.FULL
import org.brooks.FillCodes.MED

fun combineVertically(noLog: Boolean? = false, vararg strings: String): String {
    var firstSize = 0;
    fun logPredicate(list: List<List<String>>):Boolean {
        return list.any {
            println(it.size.toString() + " " + firstSize)
            return@any it.size != firstSize
        }
    }
    fun predicate(list: List<List<String>>) = list.any { it.size != firstSize }
    val linesList = strings.map { it.trimIndent().lines() }
        .apply {
            firstSize = first().size
            val badNumLines = if(noLog == true) { predicate(this) } else { logPredicate(this) }
            if(badNumLines) { throw IllegalArgumentException("Line Length Error") }
        }
    return (0 until firstSize).joinToString("\n") { i ->
        linesList.joinToString(separator = "") { it[i] }
    }
}

const val BG_COLOR = WHITE


typealias AsciiShape = String
typealias AsciiCard = String

typealias FillCode = String
object FillCodes {
    const val EMPTY: FillCode = " "
    const val MED: FillCode = "."
    const val FULL: FillCode = "="
}

fun emptySpace() = "\n`\n`\n`\n`\n`\n`\n`\n"
fun emptyLongSpace() = "\n  \n  \n  \n  \n  \n  \n  \n  \n  \n  \n  "

val leftCard = combineVertically(noLog = true, getEdgeCard(), emptySpace(), emptySpace(), emptySpace())
val rightCard = combineVertically(noLog = true, emptySpace(),  emptySpace(), emptySpace(), getEdgeCard())

fun getTopCard(c: ColorCode = BG_COLOR) = """$c _________________________________ 
$c*                                 *"""
fun getBottomCard(c: ColorCode = BG_COLOR) = "$c*_________________________________*"
fun getEdgeCard(c: ColorCode = BG_COLOR) = """
$c!
$c!
$c!
$c!
$c!
$c!
$c!
"""

fun getSquiggle(c: ColorCode, f: FillCode, e: ColorCode = BG_COLOR): AsciiShape = """
$c  .''.   $e
$c  \$f$f$f\  $e
$c  /$f$f$f/  $e
$c /$f$f$f\   $e
$c  \$f$f$f\  $e
$c  /$f$f$f/  $e
$c  '..'   $e
"""

fun getDiamond(c: ColorCode, f: FillCode, e: ColorCode = BG_COLOR): AsciiShape = """
$c    A    $e
$c   /$f\   $e
$c  /$f$f$f\  $e
$c <$f$f$f$f$f> $e
$c  \$f$f$f/  $e
$c   \$f/   $e
$c    V    $e
"""

fun getOval(c: ColorCode, f: FillCode, e: ColorCode = BG_COLOR):AsciiShape = """
$c .-'''-. $e
$c |$f$f$f$f$f| $e
$c |$f$f$f$f$f| $e
$c |$f$f$f$f$f| $e
$c |$f$f$f$f$f| $e
$c |$f$f$f$f$f| $e
$c '-___-' $e
"""

fun drawCard1(shape: Shape, color: Color, fill: Fill): String {
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
        rightCard
    )
    return """
${getTopCard()}
$combineVertical
${getBottomCard()}
"""
}

fun drawCard2(shape: Shape, color: Color, fill: Fill): String {
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
        rightCard
    )
    return """
${getTopCard()}
$combineVertical
${getBottomCard()}
"""
}
fun drawCard3(shape: Shape, color: Color, fill: Fill): String {
    val colorCode = getColorCode(color)
    val fillCode = getFillCode(fill)
    val combineVertical = combineVertically(
        noLog = true,
        leftCard,
        getShape(shape, colorCode, fillCode),
        getShape(shape, colorCode, fillCode),
        getShape(shape, colorCode, fillCode),
        rightCard
    )
    return """
${getTopCard()}
$combineVertical
${getBottomCard()}
"""
}

fun getShape(shape: Shape, colorCode: ColorCode, fillCode: FillCode) =
    when (shape) {
        Shapes.Squiggle -> getSquiggle(colorCode, fillCode)
        Shapes.Diamond -> getDiamond(colorCode, fillCode)
        Shapes.Oval -> getOval(colorCode, fillCode)
        else -> throw Error("No matching shape code")
    }

fun getColorCode(color: Color) =
    when(color){
        Colors.Red -> RED
        Colors.Blue -> BLUE
        Colors.Green -> GREEN
        else -> throw Error("No matching color code")
    }

fun getFillCode(fill: Fill) =
    when(fill){
        Fills.Full -> FULL
        Fills.Light -> EMPTY
        Fills.Shaded -> MED
        else -> throw Error("No matching color code")
    }

fun getAsciiCard(card: Card): AsciiCard =
    when(card.count){
        Counts.`1` -> drawCard1(card.shape, card.color, card.fill)
        Counts.`2` -> drawCard2(card.shape, card.color, card.fill)
        Counts.`3` -> drawCard3(card.shape, card.color, card.fill)
        else -> throw Error("No matching shape count")
    }

fun dealRow(card1: AsciiCard, card2: AsciiCard, card3: AsciiCard, card4: AsciiCard) = combineVertically(
    true,
    card1,
    emptyLongSpace(),
    card2,
    emptyLongSpace(),
    card3,
    emptyLongSpace(),
    card4
)

fun dealPlayableCards(cards: List<AsciiCard>) = buildString {
    append(dealRow(cards[0], cards[1], cards[2], cards[3]))
    appendLine()
    append(dealRow(cards[4], cards[5], cards[6], cards[7]))
    appendLine()
    append(dealRow(cards[8], cards[9], cards[10], cards[11]))
    appendLine()
}

fun main(){
    val cardsDealt = createHashMap()
        .shuffleAndDeal12()
    
    val outputString = dealPlayableCards(
        cardsDealt.map{
            val card = it.value.first
            getAsciiCard(card)
        }
    )
    print(outputString)
}