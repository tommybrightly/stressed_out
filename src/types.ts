export type Message = {
    id: string;
    text: string;
    sender: "user" | "assistant";
    createdAt: number; // epoch ms
    stress?: number; // optional stress rating attached to this message
    tags?: string[];
    };
    
    
    export type StressEntry = {
    id: string;
    createdAt: number;
    stress: number; // 1-10
    tags: string[];
    note?: string; // optional free text (e.g., the message)
    };