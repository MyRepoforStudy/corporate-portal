export interface BookingUserSummary {
  id: string;
  displayName: string;
  email: string;
}

export interface BookingWithRelations {
  id: string;
  topic: string;
  roomId: string;
  startTime: string;
  endTime: string;
  status: "CONFIRMED" | "CANCELLED";
  organizer: BookingUserSummary;
  participants: BookingUserSummary[];
}
