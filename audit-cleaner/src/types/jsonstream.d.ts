declare module 'JSONStream' {
    import { ReadWriteStream } from 'fs';
    export function parse(pattern?: any): ReadWriteStream;
    export function stringify(open?: any, sep?: any, close?: any): ReadWriteStream;
}
