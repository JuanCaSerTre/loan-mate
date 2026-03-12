/**
 * LoanMate — useContacts Hook
 * Manages contact permission, syncing, matching, and invitation state.
 *
 * Privacy: Contacts are only held in React state (memory).
 * They are never sent to any server or persisted.
 */
import { useState, useCallback } from "react";
import {
  ContactPermissionStatus,
  PhoneContact,
  LoanMateFriend,
  InvitableContact,
} from "@/types/contact";
import { User } from "@/types/loan";
import { mockPhoneContacts } from "@/data/mockContacts";
import { matchContacts, sendInvitation } from "@/services/contactService";

interface UseContactsReturn {
  /** Current permission status */
  permissionStatus: ContactPermissionStatus;
  /** Whether contacts have been loaded */
  isLoaded: boolean;
  /** Loading state during sync */
  isSyncing: boolean;
  /** Contacts that match LoanMate users */
  friends: LoanMateFriend[];
  /** Contacts not on LoanMate */
  invitableContacts: InvitableContact[];
  /** Request permission and sync contacts */
  requestPermissionAndSync: () => Promise<void>;
  /** Re-sync contacts (permission already granted) */
  resync: () => Promise<void>;
  /** Send an SMS invitation to a contact */
  invite: (phone: string, senderName: string) => Promise<boolean>;
  /** Set of phone numbers that have been invited */
  invitedPhones: Set<string>;
  /** Search filter */
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  /** Filtered friends based on search */
  filteredFriends: LoanMateFriend[];
  /** Filtered invitable contacts based on search */
  filteredInvitable: InvitableContact[];
}

/**
 * Simulates reading the device's contact list.
 * In production, this would use the Contacts API or a native bridge.
 */
async function readDeviceContacts(): Promise<PhoneContact[]> {
  // Simulate async read delay
  await new Promise((resolve) => setTimeout(resolve, 600));
  return mockPhoneContacts;
}

export function useContacts(users: User[], currentUserId: string): UseContactsReturn {
  const [permissionStatus, setPermissionStatus] = useState<ContactPermissionStatus>("prompt");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [friends, setFriends] = useState<LoanMateFriend[]>([]);
  const [invitableContacts, setInvitableContacts] = useState<InvitableContact[]>([]);
  const [invitedPhones, setInvitedPhones] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const syncContacts = useCallback(async () => {
    setIsSyncing(true);
    try {
      const rawContacts = await readDeviceContacts();
      const { friends: matched, invitable } = matchContacts(rawContacts, users, currentUserId);
      setFriends(matched);
      setInvitableContacts(invitable);
      setIsLoaded(true);
    } finally {
      setIsSyncing(false);
    }
  }, [users, currentUserId]);

  const requestPermissionAndSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Simulate permission prompt delay
      await new Promise((resolve) => setTimeout(resolve, 400));
      // In a real app, this would show a system permission dialog
      setPermissionStatus("granted");
      await syncContacts();
    } catch {
      setPermissionStatus("denied");
      setIsSyncing(false);
    }
  }, [syncContacts]);

  const resync = useCallback(async () => {
    if (permissionStatus !== "granted") return;
    await syncContacts();
  }, [permissionStatus, syncContacts]);

  const invite = useCallback(
    async (phone: string, senderName: string): Promise<boolean> => {
      const success = await sendInvitation(phone, senderName);
      if (success) {
        setInvitedPhones((prev) => new Set([...prev, phone]));
      }
      return success;
    },
    []
  );

  // Filter based on search query
  const q = searchQuery.toLowerCase().trim();

  const filteredFriends = q
    ? friends.filter(
        (f) =>
          f.contact.name.toLowerCase().includes(q) ||
          f.userName.toLowerCase().includes(q) ||
          f.contact.phoneNumbers.some((p) => p.includes(q))
      )
    : friends;

  const filteredInvitable = q
    ? invitableContacts.filter(
        (c) =>
          c.contact.name.toLowerCase().includes(q) ||
          c.contact.phoneNumbers.some((p) => p.includes(q))
      )
    : invitableContacts;

  return {
    permissionStatus,
    isLoaded,
    isSyncing,
    friends,
    invitableContacts,
    requestPermissionAndSync,
    resync,
    invite,
    invitedPhones,
    searchQuery,
    setSearchQuery,
    filteredFriends,
    filteredInvitable,
  };
}
