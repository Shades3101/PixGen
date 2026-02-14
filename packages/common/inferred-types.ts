import { z } from "zod";
import {TrainModel, GenerateImage, GenerateImageFromPack} from "./types";

export type TrainModelInput = z.infer <typeof TrainModel>;
export type GenerateModelInput = z.infer <typeof GenerateImage>;
export type GenerateImageFromPackInput = z.infer <typeof GenerateImageFromPack>;

