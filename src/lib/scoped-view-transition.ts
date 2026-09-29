type ScopedTransition = {
  ready: Promise<unknown>;
  updateCallbackDone: Promise<unknown>;
  finished: Promise<unknown>;
  skipTransition: () => void;
};

type TransitionScope = {
  startViewTransition?: (update: () => void) => ScopedTransition;
};

const running = new WeakMap<
  object,
  { stale: boolean; transition?: ScopedTransition }
>();

export function cancelScopedTransition(scope: object | null): void {
  if (!scope) return;
  const job = running.get(scope);
  if (job) {
    job.stale = true;
    job.transition?.skipTransition();
    running.delete(scope);
  }
}

/** Keep updates correct even when captures fail or filters are clicked rapidly. */
export function updateWithScopedTransition(
  scope: object | null,
  update: () => void,
  reducedMotion: boolean,
): void {
  cancelScopedTransition(scope);
  const target = scope as TransitionScope | null;
  if (
    !scope ||
    reducedMotion ||
    typeof target?.startViewTransition !== "function"
  ) {
    update();
    return;
  }
  const job: { stale: boolean; transition?: ScopedTransition } = {
    stale: false,
  };
  running.set(scope, job);
  let applied = false;
  const apply = () => {
    if (applied || job.stale) return;
    applied = true;
    update();
  };
  try {
    const transition = target.startViewTransition(apply);
    job.transition = transition;
    // A rejected capture is expected, for example when the tab becomes hidden.
    void transition.ready.catch(() => {});
    void transition.updateCallbackDone.then(apply, apply);
    void transition.finished.then(
      () => {
        if (running.get(scope) === job) running.delete(scope);
      },
      () => {
        apply();
        if (running.get(scope) === job) running.delete(scope);
      },
    );
  } catch {
    apply();
    if (running.get(scope) === job) running.delete(scope);
  }
}
