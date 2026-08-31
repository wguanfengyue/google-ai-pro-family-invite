export const INVITATION_EXECUTOR = Symbol('INVITATION_EXECUTOR');

export type InvitationExecution = {
  providerReference: string;
};

export interface InvitationExecutor {
  execute(input: {
    taskId: string;
    ownerLabel: string;
    targetEmail: string;
  }): Promise<InvitationExecution>;
}
