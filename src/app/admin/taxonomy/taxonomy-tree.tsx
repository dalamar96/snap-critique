'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import { addType, deleteType } from './actions'
import { toast } from 'sonner'

interface TaxonomyTypeRow {
    id: string
    name: string
    parent_id: string | null
    sort_order: number
}

interface TypeNode extends TaxonomyTypeRow {
    children: TypeNode[]
}

interface TaxonomyTreeProps {
    types: TaxonomyTypeRow[]
}

function buildTree(items: TaxonomyTypeRow[]): TypeNode[] {
    const map = new Map<string, TypeNode>()
    const roots: TypeNode[] = []

    // 1. Create Nodes
    items.forEach(item => {
        map.set(item.id, { ...item, children: [] })
    })

    // 2. Connect
    items.forEach(item => {
        const node = map.get(item.id)!
        if (item.parent_id) {
            const parent = map.get(item.parent_id)
            if (parent) {
                parent.children.push(node)
            } else {
                roots.push(node) // Orphan or missing parent
            }
        } else {
            roots.push(node)
        }
    })

    return roots
}

export function TaxonomyTree({ types }: TaxonomyTreeProps) {
    const tree = buildTree(types)
    return (
        <div className="space-y-2">
           {tree.length === 0 && <div className="text-slate-500 italic text-sm">No types defined.</div>}
           {tree.map(node => <TreeNode key={node.id} node={node} level={0} />)}
        </div>
    )
}

function TreeNode({ node, level }: { node: TypeNode, level: number }) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newItemName, setNewItemName] = useState('')

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItemName.trim()) return

        const result = await addType(newItemName, node.id)
        if (result?.error) toast.error(result.error)
        else {
            toast.success("Added child type")
            setNewItemName('')
            setIsAdding(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Delete ${node.name}? This will delete all children as well.`)) return
        const result = await deleteType(node.id)
        if (result?.error) toast.error(result.error)
        else toast.success("Deleted type")
    }

    return (
        <div className="select-none">
            <div 
                className="flex items-center gap-2 p-2 hover:bg-white/5 rounded group"
                style={{ paddingLeft: `${level * 1.5}rem` }}
            >
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`p-1 hover:text-primary transition-colors ${node.children.length === 0 ? 'invisible' : ''}`}
                >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                
                <span className={`text-sm ${level === 0 ? 'font-bold text-white uppercase' : 'text-slate-300'}`}>
                    {node.name}
                </span>

                <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-1 hover:bg-primary hover:text-black rounded text-slate-500 transition-colors"
                        title="Add Child"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-1 hover:bg-red-500 hover:text-white rounded text-slate-500 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Add Child Form */}
            {isAdding && (
                <form onSubmit={handleAdd} className="flex items-center gap-2 mb-2 pr-2" style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                    <div className="w-4" /> {/* Spacer for chevron */}
                    <input 
                        autoFocus
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        placeholder="Child Name..."
                        className="bg-black border border-white/20 rounded px-2 py-1 text-xs w-48 focus:border-primary focus:outline-none"
                    />
                    <button type="submit" className="text-primary hover:text-white">
                        <Plus className="w-4 h-4" />
                    </button>
                </form>
            )}

            {/* Children */}
            {isExpanded && node.children.length > 0 && (
                <div>
                    {node.children.map(child => <TreeNode key={child.id} node={child} level={level + 1} />)}
                </div>
            )}
        </div>
    )
}
