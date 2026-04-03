import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A proxy-based dummy client to handle any chainable Supabase calls gracefully.
const createDummyProxy = (initData: any = { data: null, error: { message: "Supabase not configured" } }): any => {
  const proxy: any = new Proxy(() => {}, {
    get: (target, prop) => {
      if (prop === 'then') {
        return (onFulfilled: any) => Promise.resolve(initData).then(onFulfilled);
      }
      return createDummyProxy(initData);
    },
    apply: () => proxy,
  });
  return proxy;
};

const dummyClient = {
  from: () => createDummyProxy(),
  auth: createDummyProxy({ data: { session: null }, error: null }),
  storage: createDummyProxy(),
} as any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Local storage fallback will be active.");
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : dummyClient;


