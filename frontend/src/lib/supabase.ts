import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// A proxy-based dummy client to handle any chainable Supabase calls gracefully.
type DummyResult = {
  data: unknown;
  error: { message: string } | null;
};

type DummyProxy = {
  (...args: unknown[]): DummyProxy;
  then: (onFulfilled: (value: DummyResult) => unknown) => Promise<unknown>;
};

const createDummyProxy = (
  initData: DummyResult = { data: null, error: { message: "Supabase not configured" } }
): DummyProxy => {
  const proxy = new Proxy((() => undefined) as (...args: unknown[]) => unknown, {
    get: (_, prop) => {
      if (prop === 'then') {
        return (onFulfilled: (value: DummyResult) => unknown) => Promise.resolve(initData).then(onFulfilled);
      }
      return createDummyProxy(initData);
    },
    apply: () => proxy,
  }) as unknown as DummyProxy;

  return proxy;
};

const dummyClient = {
  from: () => createDummyProxy(),
  auth: createDummyProxy({ data: { session: null }, error: null }),
  storage: createDummyProxy(),
} as unknown as ReturnType<typeof createClient>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Local storage fallback will be active.");
}

export const supabase: ReturnType<typeof createClient> = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : dummyClient;


