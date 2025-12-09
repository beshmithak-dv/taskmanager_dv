import { supabase } from './supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`;

export interface CalendarEvent {
  id?: string;
  google_event_id?: string | null;
  title: string;
  description: string;
  date: string;
  time: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${EDGE_FUNCTION_URL}?action=list`, { headers });

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error listing calendar events:', error);
    return [];
  }
}

export async function createCalendarEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${EDGE_FUNCTION_URL}?action=create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

export async function updateCalendarEvent(id: string, event: CalendarEvent): Promise<CalendarEvent | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${EDGE_FUNCTION_URL}?action=update&id=${id}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to update calendar event');
    }

    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return null;
  }
}

export async function deleteCalendarEvent(id: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${EDGE_FUNCTION_URL}?action=delete&id=${id}`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to delete calendar event');
    }

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}
