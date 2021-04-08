declare namespace RawJsonTlSchema {
    /**
     * Namespaces available in the schema.
     *
     * Key is namespace name, can be `$root` which stands
     * for root namespace (i.e. no namespace)
     *
     * Value is namespace contents.
     */
    type TlNamespaces = Record<string, TlSingleNamespace>

    /**
     * String describing some TL type.
     * Can be a namespaced name of a union,
     * or one of primitive types:
     *   - `number`: Signed 32-bit integer
     *   - `Long`: Signed 64-bit integer
     *   - `Int128`: Signed 128-bit integer
     *   - `Int256`: Signed 256-bit integer
     *   - `Double`: 64-bit floating-point value
     *   - `string`: UTF16 string
     *   - `Buffer`: Array of bytes
     *   - `false`: False
     *   - `true`: True
     *   - `boolean`: true or false
     *   - `null`: Null
     *   - `any`: Any TL object (usually used in `invokeAs*` methods to wrap other methods)
     *   - `$FlagsBitField`: 32-bit integer, which value is generated based on the present fields and their `predicate`
     */
    type TlType = string

    /**
     * Information about a generic.
     *
     * Translates to TypeScript like this:
     * ```typescript
     * type Foo<name extends super> = ...
     * ```
     */
    interface TlGeneric {
        /**
         * Name of the type used in generic
         */
        name: string

        /**
         * Constraint of the generic.
         */
        super: TlType
    }

    interface TlArgument {
        /**
         * Argument name in `camelCase`
         */
        name: string

        /**
         * Argument type, see {@link TlType}.
         * Can also be a name of some of {@link TlBaseType.generics}
         */
        type: TlType

        /** Argument description */
        description?: string

        /**
         * Whether this argument is optional.
         * When true, `predicate` is present.
         */
        optional?: true

        /**
         * String in format `<fieldName>.<byteIndex>` which declares
         * the `$FlagsBitField` to use and byte index to use when (de-)serializing.
         *
         * Field name is currently always `flags`, but TL format allows multiple bit fields.
         * Byte index starts with 0.
         */
        predicate?: string
    }

    interface TlBaseType {
        /**
         * Non-namespaced type name
         */
        name: string

        /**
         * Unsigned 32-bit ID of the type.
         * This is basically the CRC you see in the schema.
         */
        id: number

        /**
         * Method arguments or class properties.
         */
        arguments: TlArgument[]

        /** Type description */
        description?: string

        /**
         * Generic types for the type.
         */
        generics?: TlGeneric[]
    }

    interface TlError {
        /**
         * Numeric code of the error (like 404)
         */
        code: number

        /**
         * Name of the error (like `NOT_FOUND`)
         */
        name: string

        /**
         * Description of the error
         */
        description?: string
    }

    interface TlMethod extends TlBaseType {
        /**
         * Type that this method returns when called.
         */
        returns: TlType

        /**
         * List of errors that this method might throw.
         *
         * Note that this is a non-exhaustive list!
         */
        throws?: TlError[]
    }

    interface TlClass extends TlBaseType {
        /**
         * Namespaced name of the union that this type belongs to.
         */
        type: string
    }

    /**
     * Union is a group of classes that are used interchangeably.
     *
     * Translates to TypeScript like this: `type {type} = {subtypes.join(' | ')}`
     */
    interface TlUnion {
        /**
         * Non-namespaced name of the union in `PascalCase`
         */
        type: string

        /**
         * Namespaced names of the types that belong to this union
         */
        subtypes: string[]
    }

    interface TlSingleNamespace {
        /** Classes in the namespace */
        classes: TlClass[]

        /** Methods in the namespace */
        methods: TlMethod[]

        /** Unions in the namespace */
        unions: TlUnion[]
    }
}

declare interface RawJsonTlSchema {
    /**
     * TL layer number used to generate {@link api}
     */
    apiLayer: string

    mtproto: RawJsonTlSchema.TlNamespaces
    api: RawJsonTlSchema.TlNamespaces
}

declare const __rawJsonTlSchema: RawJsonTlSchema
export = __rawJsonTlSchema
