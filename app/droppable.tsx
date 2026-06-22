import { useDroppable } from "@dnd-kit/core";
import { Typography } from 'antd';

export default function Droppable(props: any) {
  const {setNodeRef} = useDroppable({
    id: props.id,
  });

  return (
    <Typography.Text ref={setNodeRef}>
        {props.children}
    </Typography.Text>
  );
}