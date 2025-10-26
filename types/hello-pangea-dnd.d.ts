declare module "@hello-pangea/dnd" {
  import * as React from "react";

  export interface DropResult {
    destination: { index: number } | null;
    source: { index: number };
    draggableId: string;
    type: string;
    reason: "DROP" | "CANCEL";
  }

  export interface DraggableProvided {
    innerRef: (element: HTMLElement | null) => any;
    draggableProps: React.HTMLAttributes<any>;
    dragHandleProps: React.HTMLAttributes<any> | null;
  }

  export interface DroppableProvided {
    innerRef: (element: HTMLElement | null) => any;
    droppableProps: React.HTMLAttributes<any>;
    placeholder: React.ReactElement | null;
  }

  export const DragDropContext: React.ComponentType<{
    onDragEnd: (result: DropResult) => void;
    children?: React.ReactNode;
  }>;

  export const Droppable: React.ComponentType<{
    droppableId: string;
    children: (provided: DroppableProvided) => React.ReactElement;
  }>;

  export const Draggable: React.ComponentType<{
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided) => React.ReactElement;
  }>;
}
