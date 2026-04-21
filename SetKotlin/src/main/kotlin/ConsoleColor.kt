package org.brooks

typealias ColorCode = String
object ConsoleColor {
    const val RESET: ColorCode = "\u001B[0m"
    const val BLACK: ColorCode = "\u001B[30m"
    const val RED: ColorCode = "\u001B[31m"
    const val GREEN: ColorCode = "\u001B[32m"
    const val YELLOW: ColorCode = "\u001B[33m"
    const val BLUE: ColorCode = "\u001B[34m"
    const val PURPLE: ColorCode = "\u001B[35m"
    const val CYAN: ColorCode = "\u001B[36m"
    const val WHITE: ColorCode = "\u001B[37m"
}