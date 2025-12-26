"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, Save, X, FileText } from "lucide-react"

interface Note {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
}

export function StudentNotes() {
  const supabase = createClient()

  const [notes, setNotes] = useState<Note[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState("")
  const [editNoteContent, setEditNoteContent] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch notes
  const fetchNotes = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (err) {
      console.error("❌ Error fetching notes:", err)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchNotes().finally(() => setLoading(false))
  }, [])

  // Create note
  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("notes").insert({
        content: newNoteContent.trim(),
        user_id: user.id,
      })

      if (error) throw error

      setNewNoteContent("")
      setIsCreating(false)
      fetchNotes()
    } catch (err) {
      console.error("❌ Error creating note:", err)
    } finally {
      setLoading(false)
    }
  }

  // Update note
  const handleUpdateNote = async (id: string) => {
    if (!editNoteContent.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from("notes")
        .update({
          content: editNoteContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
      setEditingId(null)
      fetchNotes()
    } catch (err) {
      console.error("❌ Error updating note:", err)
    } finally {
      setLoading(false)
    }
  }

  // Delete note
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return
    setLoading(true)
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id)
      if (error) throw error
      fetchNotes()
    } catch (err) {
      console.error("❌ Error deleting note:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold text-gray-900">📝 Ghi Chú Của Bạn</h2>
          <p className="text-gray-600 mt-2">Ghi lại những điều quan trọng mà bạn học được</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white text-lg px-6 py-4 font-bold rounded-2xl shadow-lg transform transition hover:scale-110 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ghi Chú Mới
        </Button>
      </div>

      {/* Create Note */}
      {isCreating && (
        <Card className="border-4 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-xl">
          <CardHeader className="flex justify-between items-center border-b-2 border-purple-200 pb-4">
            <h3 className="text-2xl font-bold text-purple-700">✨ Tạo Ghi Chú Mới</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(false)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-6 h-6" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Textarea
              placeholder="Viết ghi chú của bạn ở đây... 💭"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="min-h-32 p-4 text-lg border-2 border-purple-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleCreateNote}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white text-lg py-4 font-bold rounded-2xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? "Đang lưu..." : "Lưu Ghi Chú"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl px-6"
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {loading ? (
        <Card className="border-4 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">Đang tải ghi chú...</p>
          </CardContent>
        </Card>
      ) : notes.length === 0 ? (
        <Card className="border-4 border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 text-xl font-semibold">Bạn chưa có ghi chú nào</p>
            <p className="text-gray-500 text-lg mt-2">Hãy tạo ghi chú đầu tiên của bạn! 📚</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note, idx) => {
            const gradients = [
              "from-yellow-100 to-orange-100 border-yellow-300",
              "from-pink-100 to-red-100 border-pink-300",
              "from-green-100 to-emerald-100 border-green-300",
              "from-blue-100 to-indigo-100 border-blue-300",
              "from-purple-100 to-pink-100 border-purple-300",
              "from-cyan-100 to-blue-100 border-cyan-300",
            ]
            const gradient = gradients[idx % gradients.length]

            return (
              <Card
                key={note.id}
                className={`border-4 bg-gradient-to-br ${gradient} hover:shadow-2xl hover:scale-105 transition-all transform rounded-3xl overflow-hidden`}
              >
                <CardHeader className="pb-2">
                  {editingId === note.id ? (
                    <Textarea
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                      className="min-h-32 p-3 border-2 border-gray-300 rounded-2xl text-base font-semibold focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 break-words text-base leading-relaxed font-semibold">
                      {note.content.length > 200 ? `${note.content.substring(0, 200)}...` : note.content}
                    </p>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-600 font-semibold">
                      📅 {new Date(note.updated_at).toLocaleDateString("vi-VN")}
                    </p>
                    <div className="flex gap-2">
                      {editingId === note.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={loading}
                            className="bg-green-400 hover:bg-green-500 text-white rounded-lg"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            className="bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(note.id)
                              setEditNoteContent(note.content)
                            }}
                            className="bg-blue-400 hover:bg-blue-500 text-white rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={loading}
                            className="bg-red-400 hover:bg-red-500 text-white rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
