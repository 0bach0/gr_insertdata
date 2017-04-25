service insertData {
    void createNode(1:string str,2:string postType),
    i32 checkNode(1:string str),
    void createCommentRelationship(1:string fromUser,2:string toUser,3:string through),
    string checkReaction(1:string fromUser,2:string node),
    string createReaction(1:string fromUser,2:string node,3:string type)
}