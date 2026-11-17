"use client";

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Note {
  id: string;
  content: string;
  color: string;
  column_id: string;
}

interface Column {
  id: string;
  title: string;
}

const COLORS = [
  { name: 'Yellow', class: 'bg-yellow-100 border-yellow-200 text-yellow-900' },
  { name: 'Blue', class: 'bg-blue-100 border-blue-200 text-blue-900' },
  { name: 'Pink', class: 'bg-pink-100 border-pink-200 text-pink-900' },
  { name: 'Green', class: 'bg-green-100 border-green-200 text-green-900' },
  { name: 'Purple', class: 'bg-purple-100 border-purple-200 text-purple-900' },
];

const TaskBoard = () => {
  const [columns, setColumns] = useState<Column[]>([
    { id: '1', title: 'To Do' },
    { id: '2', title: 'In Progress' },
    { id: '3', title: 'Done' },
  ]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const addNote = (columnId: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      content: 'New sticky note...',
      color: COLORS[0].class,
      column_id: columnId,
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, content } : n));
  };

  const changeNoteColor = (id: string, colorClass: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, color: colorClass } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const moveNote = (id: string, direction: 'left' | 'right') => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const colIndex = columns.findIndex(c => c.id === note.column_id);
    const nextIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;

    if (nextIndex >= 0 && nextIndex < columns.length) {
      setNotes(notes.map(n => n.id === id ? { ...n, column_id: columns[nextIndex].id } : n));
    }
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    setColumns([...columns, { id: Math.random().toString(36).substr(2, 9), title: newColumnTitle }]);
    setNewColumnTitle('');
  };

  const deleteColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
    setNotes(notes.filter(n => n.column_id !== id));
  };

  return (
    <Layout>
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Visual Task Board</h2>
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="New column name..." 
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              className="w-48 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && addColumn()}
            />
            <Button onClick={addColumn} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Column
            </Button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px] items-start">
          {columns.map((column, colIndex) => (
            <div key={column.id} className="flex-shrink-0 w-80 space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{column.title}</h3>
                <div className="flex items-center gap-1">
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {notes.filter(n => n.column_id === column.id).length}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                    onClick={() => deleteColumn(column.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-slate-100/50 p-3 rounded-3xl min-h-[500px] space-y-4 border-2 border-dashed border-slate-200">
                {notes.filter(n => n.column_id === column.id).map((note) => (
                  <div
                    key={note.id}
                    className={`group relative p-4 rounded-2xl shadow-sm border-b-4 transition-all hover:shadow-md ${note.color}`}
                  >
                    <textarea
                      className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm font-medium leading-relaxed min-h-[80px]"
                      value={note.content}
                      onChange={(e) => updateNote(note.id, e.target.value)}
                    />
                    
                    <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full hover:bg-black/5"
                          onClick={() => moveNote(note.id, 'left')}
                          disabled={colIndex === 0}
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full hover:bg-black/5"
                          onClick={() => moveNote(note.id, 'right')}
                          disabled={colIndex === columns.length - 1}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/5">
                              <Palette className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            {COLORS.map((c) => (
                              <DropdownMenuItem 
                                key={c.name} 
                                onClick={() => changeNoteColor(note.id, c.class)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <div className={`w-3 h-3 rounded-full ${c.class.split(' ')[0]}`} />
                                {c.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full hover:bg-black/5 text-red-600"
                          onClick={() => deleteNote(note.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button 
                  variant="ghost" 
                  className="w-full py-6 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                  onClick={() => addNote(column.id)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Note
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default TaskBoard;