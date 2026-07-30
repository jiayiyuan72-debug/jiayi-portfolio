export interface VisitorMessage {
  id: string;
  nickname: string;
  message: string;
  is_read: boolean;
  visitor_ip: string;
  created_at: string;
}

export interface MessageInput {
  nickname: string;
  message: string;
}
