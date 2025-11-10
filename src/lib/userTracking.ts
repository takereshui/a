import { supabase } from './supabase';

const COOKIE_NAME = 'ai_prompt_user_id';

export function getUserCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

export function setUserCookie(cookieId: string): void {
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=${cookieId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

export async function initializeUser(): Promise<string> {
  let cookieId = getUserCookie();

  if (cookieId) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('cookie_id', cookieId)
      .maybeSingle();

    if (existingUser) {
      return existingUser.id;
    }
  }

  cookieId = crypto.randomUUID();

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ cookie_id: cookieId })
    .select()
    .single();

  if (error) {
    throw error;
  }

  setUserCookie(cookieId);
  return newUser.id;
}