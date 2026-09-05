export type AvailabilityStatus = "yes" | "no" | "maybe";

export type Member = {
  id: string;
  name: string;
  created_at: string;
};

export type Availability = {
  id: string;
  sunday: string; // yyyy-mm-dd
  member_name: string;
  status: AvailabilityStatus;
  updated_at: string;
};

export type Checkin = {
  id: string;
  sunday: string;
  member_name: string;
  checked_in_at: string;
};

export type Issue = {
  id: string;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high";
  reporter: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
};

export type ChecklistItem = {
  id: string;
  text: string;
  position: number;
  created_at: string;
};

export type ChecklistState = {
  id: string;
  sunday: string;
  item_id: string;
  done: boolean;
  done_by: string | null;
  done_at: string | null;
};

export type Setting = {
  key: string;
  value: string;
};
