import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Tag } from "antd";
import { Kind } from "./page";

export default function DraggableTag(props: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: props.id,
    });
    

    return (
        <Tag  
            style={{
                margin: '5px',
                cursor: 'grab',
                transform: CSS.Transform.toString(transform),
                opacity: isDragging ? 0 : 1,
            }}
            ref={setNodeRef}
            {...listeners}
            {...attributes}
             
            variant='solid' 
            color={'#52c41a'}>
                {props.dockName + ' ' + (props.kind === Kind.BB ? 'ББ' : props.kind === Kind.PRODUCTS ? 'ПН' : 'PEP')}
        </Tag>
    );
}