export const runtimeMessageType = {
  toggleUi: "TOGGLE_UI",
  incrementBadge: "INCREMENT_BADGE",
  resetBadge: "RESET_BADGE",
} as const;

export type ToggleUiMessage = {
  type: (typeof runtimeMessageType)["toggleUi"];
};

export type IncrementBadgeMessage = {
  type: (typeof runtimeMessageType)["incrementBadge"];
};

export type ResetBadgeMessage = {
  type: (typeof runtimeMessageType)["resetBadge"];
};

export type RuntimeMessage = ToggleUiMessage | IncrementBadgeMessage | ResetBadgeMessage;

export type ToggleUiResponse = {
  visible: boolean;
};

export type BadgeResponse = {
  count: number;
};
