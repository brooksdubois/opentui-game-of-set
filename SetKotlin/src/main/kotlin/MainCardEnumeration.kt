package org.brooks

typealias CardFaceValue = String

typealias Shape = CardFaceValue
typealias Count = CardFaceValue
typealias Fill = CardFaceValue
typealias Color = CardFaceValue

data class Card(val shape: Shape, val color: Color, val fill: Fill, val count: Count)


object Shapes {
    const val Squiggle: Shape = "S"
    const val Oval: Shape = "O"
    const val Diamond: Shape = "D"

    fun getShapes():List<Shape> =
        listOf(Oval, Diamond, Squiggle)

    fun isShape(input: String) =
        input == Squiggle ||
        input == Oval ||
        input == Diamond
}

object Fills {
    const val Light: Fill = "L"
    const val Shaded: Fill = "S"
    const val Full: Fill = "F"

    fun getFills(): List<CardFaceValue>
    = listOf(Full, Shaded, Light)

    fun isFill(input: String) =
        input == Full ||
        input == Shaded ||
        input == Light

}

object Colors {
    const val Red: Color = "R"
    const val Green: Color = "G"
    const val Blue: Color = "B"

    fun getColors(): List<CardFaceValue>
            = listOf(Red, Green, Blue)

    fun isColorCode(input: String) =
        input == Red ||
        input == Green ||
        input == Blue
}

object Counts {
    const val `1`: Count = "1"
    const val `2`: Count = "2"
    const val `3`: Count = "3"

    fun getCounts(): List<CardFaceValue> = listOf(Counts.`1`, Counts.`2`, Counts.`3`)

    fun isCountCode(input: String) =
        input == Counts.`1` ||
        input == Counts.`2` ||
        input == Counts.`3`
}

const val sep = ","
const val endLine = "|"

typealias CardSerialized = String
fun Card.toCardStr(): CardSerialized =
    "$endLine$count$sep$color$sep$fill$sep$shape$endLine"

typealias CardIndex = Int
typealias CardHashMap = MutableMap<CardIndex, Pair<Card, CardSerialized>>
fun createHashMap(): CardHashMap {
    val cardHashMap: CardHashMap = mutableMapOf()
    Shapes.getShapes().forEachIndexed { shapeIndex, shape ->
        Counts.getCounts().forEachIndexed { countIndex, count ->
            Fills.getFills().forEachIndexed { filIndex, fill ->
                Colors.getColors().forEachIndexed { colorIndex, color ->
                    val card = Card(shape, color, fill, count)
                    val cardStr = card.toCardStr()
                    val cardIndex = "${shapeIndex+1}${countIndex+1}${filIndex+1}${colorIndex+1}".toInt()
                    cardHashMap[cardIndex] = Pair(card, cardStr)
                }
            }
        }
    }
    return cardHashMap
}

fun CardHashMap.shuffleAndDeal12() = this.entries.shuffled().take(12)
fun CardHashMap.shuffle() = this.entries.shuffled()



fun main() {
    val dealCards = createHashMap().shuffle().take(12)

    repeat(3){outerX ->
        repeat(4){innerY ->
            print(dealCards[outerX * 4 + innerY].value.second)
        }

        if(outerX != 2) println()
    }

}
