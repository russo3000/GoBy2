export type RootStackParams = {
  Home: undefined;
  Place: { id: number };
  Capture: { id?: number; listId?: number } | undefined;
};
