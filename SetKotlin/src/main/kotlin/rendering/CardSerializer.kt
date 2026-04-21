package org.brooks.rendering

import org.brooks.domain.Card

private const val sep = ","
private const val endLine = "|"

typealias CardSerialized = String

fun Card.toCardStr(): CardSerialized =
    "$endLine$count$sep$color$sep$fill$sep$shape$endLine"
