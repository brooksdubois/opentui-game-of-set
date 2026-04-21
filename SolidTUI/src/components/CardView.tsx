import { colorByCardColor, renderCardArt } from "../cardArt";
import type { SetCard } from "../types";

interface CardViewProps {
  card: SetCard;
  label: string;
}

export function CardView(props: CardViewProps) {
  const borderColor = () => (props.card.selected ? "#f6d365" : "#dfe7eb");

  return (
    <box
      border
      borderColor={borderColor()}
      title={` ${props.label} `}
      titleAlignment="center"
      width={17}
      height={10}
      paddingX={1}
      alignItems="center"
      justifyContent="center"
    >
      <text fg={colorByCardColor[props.card.color]} wrapMode="none">
        {renderCardArt(props.card)}
      </text>
    </box>
  );
}
