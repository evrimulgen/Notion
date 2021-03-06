package edu.mayo.qia.pacs.db;

import org.apache.shiro.subject.Subject;
import org.hibernate.Query;
import org.hibernate.SessionFactory;
import org.hibernate.criterion.Restrictions;

import edu.mayo.qia.pacs.components.User;

public class UserDAO extends SimpleDAO<User> {

  public UserDAO(SessionFactory sessionFactory) {
    super(sessionFactory);
  }

  public User getFromSubject(Subject subject) {
    if (subject == null || subject.getPrincipal() == null) {
      return null;
    }
    User user = (User) currentSession().createCriteria(User.class).add(Restrictions.eq("username", subject.getPrincipal().toString())).uniqueResult();
    return user;
  }

  public User findByHash(String hash) {
    return (User) currentSession().createCriteria(User.class).add(Restrictions.eq("ActivationHash", hash)).uniqueResult();
  }

  public User findByEmail(String email) {
    return (User) currentSession().createCriteria(User.class).add(Restrictions.eq("email", email)).uniqueResult();
  }

  public User getByUID(String uid) {
    Query query = currentSession().createQuery("from User where uid = :uid");
    query.setString("uid", uid);
    return (User) query.uniqueResult();
  }

}
