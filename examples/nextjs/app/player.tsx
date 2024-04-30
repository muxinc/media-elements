'use client';

export default function Player(props: any) {
  const { as: PlayerElement, ...rest } = props;
  return (
    <PlayerElement
      {...rest}
      onPlay={(event: Event) => {
        console.log(event.type);
      }}
      onPause={(event: Event) => {
        console.log(event.type);
      }}
    ></PlayerElement>
  );
}
