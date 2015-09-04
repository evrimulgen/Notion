package edu.mayo.qia.pacs.db;

import org.hibernate.SessionFactory;

import edu.mayo.qia.pacs.components.GroupRole;

public class GroupRoleDAO extends SimpleDAO<GroupRole> {

  public GroupRoleDAO(SessionFactory sessionFactory) {
    super(sessionFactory);
  }

}
