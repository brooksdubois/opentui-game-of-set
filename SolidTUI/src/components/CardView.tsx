import { colorByCardColor, renderCardArt } from "../cardArt";
import type { SetCard } from "../types";
import type { MouseEvent } from "@opentui/core";

interface CardViewProps {
  card: SetCard;
  focused: boolean;
  hovered: boolean;
  invalid: boolean;
  onClick: (event: MouseEvent) => void;
  onHoverStart: (event: MouseEvent) => void;
  onHoverEnd: () => void;
}

export function CardView(props: CardViewProps) {
  const borderColor = () => {
    if (props.invalid) return "#ff5f5f";
    if (props.card.selected) return "#f6d365";
    return "#dfe7eb";
  };
  const borderStyle = () => (props.focused || props.hovered ? "double" : "single");
  const handleMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    props.onClick(event);
  };

  return (
    <box
      border
      borderStyle={borderStyle()}
      borderColor={borderColor()}
      width={35}
      height={11}
      padding={0}
      onMouseDown={handleMouseDown}
      onMouseOver={props.onHoverStart}
      onMouseMove={props.onHoverStart}
      onMouseOut={props.onHoverEnd}
    >
      <text
        fg={colorByCardColor[props.card.color]}
        wrapMode="none"
        selectable={false}
        onMouseDown={handleMouseDown}
        onMouseOver={props.onHoverStart}
        onMouseMove={props.onHoverStart}
        onMouseOut={props.onHoverEnd}
      >
        {renderCardArt(props.card)}
      </text>
    </box>
  );
}
