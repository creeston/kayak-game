export interface RiverEnvironmentElement {
    type: string;
    shape?: number[][];
    location?: number[];
    tags?: any;
}

export type RiverEnvironment = RiverEnvironmentElement[];
