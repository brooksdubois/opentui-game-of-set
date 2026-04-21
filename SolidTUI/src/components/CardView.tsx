import { colorByCardColor, renderCardArt } from "../cardArt";
import type { SetCard } from "../types";

interface CardViewProps {
  card: SetCard;
}

export function CardView(props: CardViewProps) {
  return (
    <box
      border
      borderColor="#dfe7eb"
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
