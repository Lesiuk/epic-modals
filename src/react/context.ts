import { createContext, type ReactNode } from 'react';
import type { ModalId } from '../core/types';
import type { ModalLibraryConfig } from '../core/config';

export const ModalIdContext = createContext<ModalId | null>(null);

export const ModalProviderConfigContext = createContext<Partial<ModalLibraryConfig> | undefined>(undefined);

type RenderIconFn = (iconName: string) => ReactNode;
export const RenderIconContext = createContext<RenderIconFn | undefined>(undefined);
