package org.brooks.domain

typealias CardFaceValue = String

typealias Shape = CardFaceValue
typealias Count = CardFaceValue
typealias Fill = CardFaceValue
typealias Color = CardFaceValue

data class Card(
    val shape: Shape,
    val color: Color,
    val fill: Fill,
    val count: Count,
)

object Shapes {
    const val Squiggle: Shape = "S"
    const val Oval: Shape = "O"
    const val Diamond: Shape = "D"

    fun getShapes(): List<Shape> = listOf(Oval, Diamond, Squiggle)

    fun isShape(input: String): Boolean =
        input == Squiggle ||
            input == Oval ||
            input == Diamond
}

object Fills {
    const val Light: Fill = "L"
    const val Shaded: Fill = "S"
    const val Full: Fill = "F"

    fun getFills(): List<Fill> = listOf(Full, Shaded, Light)

    fun isFill(input: String): Boolean =
        input == Full ||
            input == Shaded ||
            input == Light
}

object Colors {
    const val Red: Color = "R"
    const val Green: Color = "G"
    const val Blue: Color = "B"

    fun getColors(): List<Color> = listOf(Red, Green, Blue)

    fun isColorCode(input: String): Boolean =
        input == Red ||
            input == Green ||
            input == Blue
}

object Counts {
    const val `1`: Count = "1"
    const val `2`: Count = "2"
    const val `3`: Count = "3"

    fun getCounts(): List<Count> = listOf(`1`, `2`, `3`)

    fun isCountCode(input: String): Boolean =
        input == `1` ||
            input == `2` ||
            input == `3`
}
