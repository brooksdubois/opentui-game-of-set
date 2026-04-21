interface HeaderProps {
  title: string;
}

export function Header(props: HeaderProps) {
  return (
    <box border borderColor="#6b7c85" paddingX={2} height={3} alignItems="center">
      <text fg="#f4f1de" attributes={1}>
        {props.title}
      </text>
    </box>
  );
}
