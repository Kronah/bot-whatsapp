# 🤖 Bot WhatsApp - Sistema de Autoaprendizado

## 📚 Como funciona o Autoaprendizado

O bot agora consegue **aprender** novas informações que você ensina!

---

## 💡 Comandos Disponíveis

### 1️⃣ **Ensinar um novo MOB**
```
.aprenda <nome> | <url>
```

**Exemplo:**
```
.aprenda Barqueata | https://divolion.net/boss/123
.aprenda Hydra | https://divolion.net/boss/456
```

✅ O bot vai guardar e nunca esquecer!

---

### 2️⃣ **Listar o que foi aprendido**
```
.aprendizados
```

Mostra tudo que o bot aprendeu, organizado por categoria.

---

### 3️⃣ **Esquecer um aprendizado**
```
.esqueça <nome>
```

**Exemplo:**
```
.esqueça Barqueata
```

---

## 🔍 **Como funciona a busca agora**

### Antes:
- `.barqueata` → Buscava sempre online
- Podia falhar se site estivesse fora

### Agora:
1. Primeiro procura no **aprendizado** (rápido! ⚡)
2. Se não encontrou, busca nos **mobs oficiais**
3. Se nada encontrou, sugere: `.aprenda nome | url`

---

## 📊 **Exemplo prático:**

### Dia 1: Ensinar o bot
```
👤 User: .aprenda Barqueata | https://divolion.net/boss/barqueata
🤖 Bot: ✅ Aprendido: Barqueata
        📚 Fonte: https://divolion.net/boss/barqueata
```

### Dia 2: Usar o aprendizado
```
👤 User: .barqueata
🤖 Bot: 📚 Encontrado no aprendizado!
        📚 Fonte: https://divolion.net/boss/barqueata
```

---

## 💾 **Onde fica guardado?**

Os aprendizados são salvos em:
```
aprendizados.json
```

Estrutura:
```json
{
  "mobs": {
    "Barqueata": {
      "dados": { "nome": "Barqueata" },
      "fonte": "https://divolion.net/boss/barqueata",
      "dataAprendizado": "2026-04-16T21:30:00.000Z"
    }
  },
  "custom": {},
  "lastUpdate": "2026-04-16T21:30:00.000Z"
}
```

---

## 🎯 **Casos de Uso**

### 1. **Guardar alterações de mobs**
```
.aprenda Barqueata_Nova | https://novo-site.com/barqueata
```

### 2. **Criar aliases personalizados**
```
.aprenda BQ | https://barqueata-info
.aprenda Barq | https://barqueata-info
```

### 3. **Guardar informações de eventos**
```
.aprenda EventoEspecial_Abril | https://evento.info
```

---

## ⚡ **Vantagens**

✅ **Rápido**: Busca local em JSON (instantâneo)  
✅ **Confiável**: Funciona mesmo se o site cair  
✅ **Flexível**: Você controla o que é guardado  
✅ **Persistente**: Sobrevive reinicializações  

---

## 🔄 **Sincronizar entre dispositivos**

Se rodar em múltiplos aparelhos:

```bash
# No computador
scp aprendizados.json admin@celular:/data/data/com.termux/...

# Ou copia manualmente o arquivo
```

---

## ❓ **Dúvidas**

**P: Quanto o bot consegue memorizar?**  
R: Praticamente ilimitado (JSON é só texto)

**P: Os aprendizados viram comandos?**  
R: Não. Sempre use `.nome` para buscar

**P: Posso editar manualmente aprendizados.json?**  
R: Sim! Mas cuidado com a formatação JSON

**P: Isso funciona com Bosslive e OLY?**  
R: Não ainda. Focado em mobs por enquanto. Quer que eu adicione?

---

## 📝 **Próximas melhorias sugeridas**

- [ ] Sistema de aprendizado para Bosslive
- [ ] Aprendizado para OLY
- [ ] Sincronização automática entre dispositivos
- [ ] Votação da comunidade (mobs mais buscados)
- [ ] Exportar/importar aprendizados

**Bora aprender! 📚🚀**
