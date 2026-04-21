interface FooterHelpProps {
  prompt: string;
}

export function FooterHelp(props: FooterHelpProps) {
  return (
    <box border borderColor="#3a4a50" paddingX={2} height={4} flexDirection="column">
      <text fg="#f4f1de">{props.prompt}</text>
      <text fg="#9fb3bd">Mock only: no keyboard, mouse, subprocess, or engine integration in this pass.</text>
    </box>
  );
}
