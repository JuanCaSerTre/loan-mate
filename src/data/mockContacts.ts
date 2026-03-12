/**
 * LoanMate — Mock Contacts Data
 * Simulates a user's phone contact list for development/demo.
 * In production, this would be replaced by the Contacts API.
 */
import { PhoneContact } from "@/types/contact";

/**
 * Simulated phone contacts — some match LoanMate users, some don't.
 * mockUsers phones:
 *   - Alex Johnson (current): +1 (555) 234-5678
 *   - Maria Garcia: +1 (555) 987-6543
 *   - James Chen: +1 (555) 123-4567
 *   - Sarah Miller: +1 (555) 456-7890
 */
export const mockPhoneContacts: PhoneContact[] = [
  {
    id: "contact_1",
    name: "Maria Garcia",
    phoneNumbers: ["+15559876543", "+15559876544"],
    avatar: "MG",
  },
  {
    id: "contact_2",
    name: "James Chen",
    phoneNumbers: ["(555) 123-4567"],
    avatar: "JC",
  },
  {
    id: "contact_3",
    name: "Sarah Miller",
    phoneNumbers: ["555-456-7890", "+15554567890"],
    avatar: "SM",
  },
  {
    id: "contact_4",
    name: "David Wilson",
    phoneNumbers: ["+15558881234"],
    avatar: "DW",
  },
  {
    id: "contact_5",
    name: "Emma Thompson",
    phoneNumbers: ["(555) 777-9999"],
    avatar: "ET",
  },
  {
    id: "contact_6",
    name: "Mike Rodriguez",
    phoneNumbers: ["+15553334444"],
    avatar: "MR",
  },
  {
    id: "contact_7",
    name: "Lisa Park",
    phoneNumbers: ["555.222.6666"],
    avatar: "LP",
  },
  {
    id: "contact_8",
    name: "Tom Baker",
    phoneNumbers: ["+15551119999"],
    avatar: "TB",
  },
  {
    id: "contact_9",
    name: "Jessica Lee",
    phoneNumbers: ["(555) 444-5555", "+15554445555"],
    avatar: "JL",
  },
  {
    id: "contact_10",
    name: "Ryan Kim",
    phoneNumbers: ["+15556667777"],
    avatar: "RK",
  },
  {
    id: "contact_11",
    name: "Mom",
    phoneNumbers: ["+15559990001"],
  },
  {
    id: "contact_12",
    name: "Dad",
    phoneNumbers: ["+15559990002"],
  },
];
