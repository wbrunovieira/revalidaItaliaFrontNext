// src/components/ui/moderation-controls.tsx
'use client';

import { useState } from 'react';
import { Pencil, Ban, Unlock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ModerationControlsProps {
  item: {
    id: string;
    title?: string;
    content: string;
    isBlocked?: boolean;
    wasEdited?: boolean;
  };
  type: 'post' | 'comment' | 'reply';
  size?: 'xs' | 'sm' | 'md';
  onUpdate?: () => void;
}

export function ModerationControls({ item, type, size = 'sm', onUpdate }: ModerationControlsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Não mostrar para usuários não-moderadores
  if (user?.role !== 'admin' && user?.role !== 'tutor') return null;

  // Tamanhos dos ícones baseado no size prop
  const iconSize = size === 'xs' ? 10 : size === 'sm' ? 12 : 14;
  const buttonSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'default';

  // Handler para editar APENAS título (somente posts têm título)
  const handleEditTitle = async () => {
    console.log('📝 Editando título do', type, ':', {
      id: item.id,
      originalTitle: item.title,
      newTitle: editedTitle,
      editedBy: user?.id,
      editedByRole: user?.role,
      editedAt: new Date().toISOString()
    });

    setIsSubmitting(true);

    // TODO: Quando a API estiver pronta, substituir por:
    // await api.patch(`/api/v1/community/posts/${item.id}`, {
    //   title: editedTitle
    // });

    // Simular delay de API
    setTimeout(() => {
      toast({
        title: "✅ Título editado",
        description: "O título foi atualizado com sucesso.",
      });
      setIsSubmitting(false);
      setShowEditModal(false);
      onUpdate?.();
    }, 1000);
  };

  // Handler para confirmar e executar bloqueio/desbloqueio
  const handleConfirmBlock = async () => {
    const action = item.isBlocked ? 'desbloquear' : 'bloquear';
    
    console.log(`🔒 ${action} ${type}:`, {
      id: item.id,
      action: action,
      currentStatus: item.isBlocked,
      newStatus: !item.isBlocked,
      moderatedBy: user?.id,
      moderatedByRole: user?.role,
      moderatedAt: new Date().toISOString()
    });

    setIsSubmitting(true);

    // TODO: Quando a API estiver pronta, substituir por:
    // await api.patch(`/api/v1/community/${type}s/${item.id}/block`, {
    //   isBlocked: !item.isBlocked
    // });

    // Simular delay de API
    setTimeout(() => {
      toast({
        title: item.isBlocked ? "🔓 Conteúdo desbloqueado" : "🔒 Conteúdo bloqueado",
        description: item.isBlocked
          ? "O conteúdo está visível novamente para todos."
          : "O conteúdo foi ocultado para usuários comuns.",
        variant: item.isBlocked ? "default" : "destructive"
      });

      setIsSubmitting(false);
      setShowBlockConfirmModal(false);
      onUpdate?.();
    }, 1000);
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        {/* Botão Editar - APENAS para posts (que têm título) */}
        {type === 'post' && (
          <Button 
            size={buttonSize as 'default' | 'sm' | 'lg' | 'icon'}
            variant="ghost"
            onClick={() => setShowEditModal(true)}
            className="text-gray-500 hover:text-blue-500"
            title="Editar título"
          >
            <Pencil size={iconSize} />
            {size !== 'xs' && <span className="ml-1 text-xs">Editar título</span>}
          </Button>
        )}

        {/* Botão Toggle Block/Unblock - Para TODOS os tipos */}
        <Button 
          size={buttonSize as 'default' | 'sm' | 'lg' | 'icon'}
          variant={item.isBlocked ? "outline" : "ghost"}
          onClick={() => setShowBlockConfirmModal(true)}
          className={cn(
            "transition-colors",
            item.isBlocked 
              ? "text-green-600 hover:bg-green-50 border-green-300" 
              : "text-gray-500 hover:text-red-500"
          )}
          title={item.isBlocked ? "Desbloquear conteúdo" : "Bloquear conteúdo"}
        >
          {item.isBlocked ? (
            <>
              <Unlock size={iconSize} />
              {size !== 'xs' && <span className="ml-1 text-xs">Desbloquear</span>}
            </>
          ) : (
            <>
              <Ban size={iconSize} />
              {size !== 'xs' && <span className="ml-1 text-xs">Bloquear</span>}
            </>
          )}
        </Button>

        {/* Indicadores de status */}
        {item.isBlocked && (
          <Badge variant="destructive" className="ml-2 text-xs">
            Bloqueado
          </Badge>
        )}

        {item.wasEdited && (
          <span className="text-xs text-gray-400 ml-2 italic">
            (título editado)
          </span>
        )}
      </div>

      {/* Modal de Edição de Título - APENAS para posts */}
      {type === 'post' && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[525px] bg-primary-dark border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>
                Editar Título do Post
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Campo de Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Título do post"
                  className="w-full bg-primary/50 border-gray-600 text-white"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400">
                  {editedTitle.length}/200 caracteres
                </p>
              </div>

              {/* Preview do conteúdo original (não editável) */}
              <div className="space-y-2">
                <Label>Conteúdo (não editável)</Label>
                <div className="p-3 bg-primary/30 rounded-lg text-sm text-gray-300 max-h-[150px] overflow-y-auto border border-gray-700">
                  {item.content}
                </div>
                <p className="text-xs text-gray-500">
                  Moderadores podem apenas editar o título, não o conteúdo.
                </p>
              </div>

              {/* Aviso de moderação */}
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                <AlertCircle className="inline-block mr-2 text-yellow-600" size={16} />
                <span className="text-sm text-yellow-400">
                  Esta ação será registrada e o autor será notificado da edição do título.
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="border-gray-600 text-white hover:bg-primary/50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditTitle}
                disabled={isSubmitting || !editedTitle.trim()}
                className="bg-secondary hover:bg-secondary/80"
              >
                {isSubmitting ? "Salvando..." : "Salvar título"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Confirmação para Bloquear/Desbloquear */}
      <Dialog open={showBlockConfirmModal} onOpenChange={setShowBlockConfirmModal}>
        <DialogContent className="sm:max-w-[425px] bg-primary-dark border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {item.isBlocked ? (
                <>
                  <Unlock className="text-green-500" size={20} />
                  Desbloquear Conteúdo
                </>
              ) : (
                <>
                  <Ban className="text-red-500" size={20} />
                  Bloquear Conteúdo
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              {item.isBlocked ? (
                "Tem certeza que deseja desbloquear este conteúdo? Ele voltará a ser visível para todos os usuários."
              ) : (
                "Tem certeza que deseja bloquear este conteúdo? Ele será ocultado para usuários comuns e só ficará visível para moderadores."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Preview do conteúdo */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">
                {type === 'post' ? 'Post' : type === 'comment' ? 'Comentário' : 'Resposta'}
              </Label>
              <div className="p-3 bg-primary/30 rounded-lg border border-gray-700">
                {item.title && (
                  <h4 className="font-medium text-white mb-2">{item.title}</h4>
                )}
                <p className="text-sm text-gray-300 line-clamp-3">{item.content}</p>
              </div>
            </div>

            {/* Aviso de moderação */}
            <div className={cn(
              "mt-4 rounded-lg p-3 flex items-start gap-2",
              item.isBlocked ? "bg-green-900/20 border border-green-700" : "bg-red-900/20 border border-red-700"
            )}>
              <AlertCircle 
                className={cn("mt-0.5", item.isBlocked ? "text-green-600" : "text-red-600")} 
                size={16} 
              />
              <div>
                <p className={cn("text-sm", item.isBlocked ? "text-green-400" : "text-red-400")}>
                  {item.isBlocked ? (
                    "Ao desbloquear, este conteúdo voltará a ser visível para todos os usuários da plataforma."
                  ) : (
                    "Ao bloquear, este conteúdo ficará oculto para usuários comuns. Apenas moderadores poderão visualizá-lo."
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Esta ação será registrada para fins de auditoria.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBlockConfirmModal(false)}
              disabled={isSubmitting}
              className="border-gray-600 text-white hover:bg-primary/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmBlock}
              disabled={isSubmitting}
              variant={item.isBlocked ? "default" : "destructive"}
              className={cn(
                item.isBlocked && "bg-green-600 hover:bg-green-700"
              )}
            >
              {isSubmitting ? (
                "Processando..."
              ) : (
                item.isBlocked ? "Desbloquear" : "Bloquear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}