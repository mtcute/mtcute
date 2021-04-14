const rawSchema = require('@mtcute/tl/raw-schema')
const rawErrors = require('@mtcute/tl/raw-errors')
const path = require('path')
const { convertToArrays, prepareData } = require('./scripts/prepare-data')

const TL_NODE_TYPE = 'TlObject'

exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
    const { createNode } = actions

    function createForNs(ns, prefix = '') {
        ns.classes.forEach((cls) => {
            createNode({
                ...cls,
                id: createNodeId(`${TL_NODE_TYPE}-class-${prefix}${cls.name}`),
                parent: null,
                children: [],
                type: 'class',
                prefix,
                internal: {
                    type: TL_NODE_TYPE,
                    content: JSON.stringify(cls),
                    contentDigest: createContentDigest(cls),
                },
            })
        })

        ns.methods.forEach((cls) => {
            createNode({
                ...cls,
                id: createNodeId(`${TL_NODE_TYPE}-method-${prefix}${cls.name}`),
                parent: null,
                children: [],
                type: 'method',
                prefix,
                internal: {
                    type: TL_NODE_TYPE,
                    content: JSON.stringify(cls),
                    contentDigest: createContentDigest(cls),
                },
            })
        })

        ns.unions.forEach((cls) => {
            createNode({
                ...cls,
                name: cls.type,
                id: createNodeId(`${TL_NODE_TYPE}-union-${prefix}${cls.type}`),
                parent: null,
                children: [],
                type: 'union',
                prefix,
                internal: {
                    type: TL_NODE_TYPE,
                    content: JSON.stringify(cls),
                    contentDigest: createContentDigest(cls),
                },
            })
        })
    }

    const mtproto = convertToArrays(rawSchema.mtproto)
    const api = convertToArrays(rawSchema.api)

    prepareData(mtproto)
    prepareData(api)

    createForNs(mtproto, 'mtproto/')
    createForNs(api)
}

const TLObject = path.resolve('./src/templates/tl-object.tsx')
const TlTypesList = path.resolve('./src/templates/tl-types-list.tsx')

exports.createPages = async ({ graphql, actions }) => {
    const result = await graphql(`
        query {
            allTlObject {
                nodes {
                    prefix
                    name
                    type
                    namespace
                    subtypes
                }
            }
        }
    `)

    result.data.allTlObject.nodes.forEach((node) => {
        actions.createPage({
            path: `${node.prefix}${node.type}/${node.name}`,
            component: TLObject,
            context: {
                ...node,
                hasSubtypes: !!node.subtypes,
            },
        })
    })

    const result2 = await graphql(`
        query {
            allTlObject {
                group(field: prefix) {
                    fieldValue
                    nodes {
                        namespace
                    }
                }
            }
        }
    `)

    result2.data.allTlObject.group.forEach(({ fieldValue: prefix, nodes }) => {
        const namespaces = [...new Set(nodes.map(i => i.namespace))]

        namespaces.forEach((ns) => {
            let namespace
            if (ns === '$root') namespace = ''
            else namespace = '/' + ns

            ;(['types', 'methods']).forEach((type) => {
                actions.createPage({
                    path: `${prefix}${type}${namespace}`,
                    component: TlTypesList,
                    context: {
                        prefix,
                        ns,
                        type,
                        isTypes: type === 'types',
                        isMethods: type === 'methods'
                    }
                })
            })
        })
    })
}
