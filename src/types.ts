export interface FanPowerEventTracker {
  propLoaded(args: {
    propId: string;
    pickIds: string[];
    visitor: VisitorContext;
  }): Promise<void>;

  propInView(args: { propId: string; pickIds: string[] }): Promise<void>;

  pickSelected(args: { propId: string; pickId: string }): Promise<void>;
}

export type VisitorContext = {
  id: string;
  email: string;
};
