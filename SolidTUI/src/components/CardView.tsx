import { colorByCardColor, renderCardArt } from "../cardArt";
import type { SetCard } from "../types";

interface CardViewProps {
  card: SetCard;
  focused: boolean;
  invalid: boolean;
}

export function CardView(props: CardViewProps) {
  const borderColor = () => {
    if (props.invalid) return "#ff5f5f";
    if (props.card.selected) return "#f6d365";
    return "#dfe7eb";
  };
  const borderStyle = () => (props.focused ? "double" : "single");

  return (
    <box
      border
      borderStyle={borderStyle()}
      borderColor={borderColor()}
      width={35}
      height={11}
      padding={0}
    >
      <text fg={colorByCardColor[props.card.color]} wrapMode="none">
        {renderCardArt(props.card)}
      </text>
    </box>
  );
}
