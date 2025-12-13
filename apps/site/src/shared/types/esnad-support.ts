import { 
    Message, 
    MessageThread, 
    NewMessage,
    NewMessageThread,
 } from '../schema/types'
import { EsnadHuman } from './esnad'

export interface EsnadSupportMessage extends Message {
    dataIn: EsnadSupportMessageDataIn
}
export interface NewEsnadSupportMessage extends NewMessage {
    dataIn: EsnadSupportMessageDataIn
}
export interface EsnadSupportMessageDataIn {
    humanHaid: EsnadHuman['haid']
    content: string
    messageType: EsnadSupportMessageType
    mediaUuid?: string // UUID of uploaded media file (for photo/document messages)
}
export type EsnadSupportMessageType = 'text' | 'voice' | 'photo' | 'document'

export interface EsnadSupportChat extends MessageThread {
    type: 'SUPPORT'
    dataIn: EsnadSupportChatDataIn

}
export interface NewEsnadSupportChat extends NewMessageThread {
    dataIn?: EsnadSupportChatDataIn
    type: 'SUPPORT'
}
export interface EsnadSupportChatDataIn {
    humanHaid: EsnadHuman['haid']
    managerHaid?: EsnadHuman['haid']
}